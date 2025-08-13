<?php
/**
 * Contact form endpoint
 * ------------------------------------------------------
 * Pranon POST nga formularët e faqes dhe dërgon email.
 * - Së pari përpiqet me SMTP (PHPMailer) nëse mail.config.php është konfiguruar
 * - Nëse jo, bie tek native mail() (mund të jetë i ç'aktivizuar në disa host)
 * - Kthen JSON { ok:true|false, ... } që lexohet nga fetch() në frontend
 * - Përfshin honeypot anti‑spam dhe limit gjatësie inputesh
 *
 * Steps për aktivizim SMTP:
 *   1. composer require phpmailer/phpmailer
 *   2. Plotëso mail.config.php me host real & kredenciale
 *   3. Sigurohu që sendmail / firewall lejon daljen në port (587 / 465)
 */

// ---------- Konfigurimet Bazë ----------
$TO             = 'info@devycore.com';          // Destinacioni final i mesazhit
$SUBJECT_PREFIX = 'Devycore Contact';           // Prefiks në subjekt
$sendingDomain  = 'devycore.com';               // Domain për header From fallback
$ALLOWED_ORIGIN = $_SERVER['HTTP_ORIGIN'] ?? ''; // Mund të fiksohet p.sh. https://devycore.com
$LOG_FILE       = __DIR__.'/mail.log';          // Log i thjeshtë tekst

// Mbledh log lines në RAM pastaj flush në fund (reduktim I/O)
$logLines = [];
function log_line($line){
  global $logLines; $logLines[] = '['.date('Y-m-d H:i:s').'] '.$line;
}
log_line('Request start');

// ---------- Headers / CORS / Content-Type ----------
if($ALLOWED_ORIGIN){
  header('Access-Control-Allow-Origin: '.$ALLOWED_ORIGIN);
  header('Vary: Origin');
}
header('Content-Type: application/json; charset=UTF-8');

// Vetëm POST lejohet
if(($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST'){
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'method_not_allowed']);
  log_line('Rejected: method != POST');
  if($logLines) @file_put_contents($LOG_FILE, implode(PHP_EOL,$logLines).PHP_EOL, FILE_APPEND);
  exit;
}

// ---------- Honeypot Anti‑Spam ----------
if(!empty($_POST['website'])){
  // Kthejmë sukses të heshtur për të mos i dhënë feedback bot-it
  log_line('Honeypot triggered');
  echo json_encode(['ok'=>true]);
  if($logLines) @file_put_contents($LOG_FILE, implode(PHP_EOL,$logLines).PHP_EOL, FILE_APPEND);
  exit;
}

// ---------- Sanitizim & Validim ----------
function clean($v){
  $v = trim($v ?? '');
  $v = str_replace(["\r","\n"], ' ', $v); // heq newline për të parandaluar header injection
  return htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$name    = clean($_POST['name'] ?? '');
$email   = clean($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? ''); // ruaj tekstin e papastruar për body (por pa CRLF injection më sipër)
$company = clean($_POST['company'] ?? '');

if($name === '' || !preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $email) || $message === ''){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'invalid_fields']);
  log_line('Invalid fields');
  if($logLines) @file_put_contents($LOG_FILE, implode(PHP_EOL,$logLines).PHP_EOL, FILE_APPEND);
  exit;
}

// Kufijtë (parandalon abuzim / fjalor shumë i madh)
if(strlen($name) > 100 || strlen($email) > 160 || strlen($company) > 140 || strlen($message) > 5000){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'too_long']);
  log_line('Payload too long');
  if($logLines) @file_put_contents($LOG_FILE, implode(PHP_EOL,$logLines).PHP_EOL, FILE_APPEND);
  exit;
}
log_line("Parsed fields name=$name email=$email company=".($company?:'-'));

// ---------- Ndërtimi i email-it ----------
$ip      = $_SERVER['REMOTE_ADDR']      ?? 'unknown';
$ua      = $_SERVER['HTTP_USER_AGENT']  ?? 'unknown';
$date    = date('c');
$subject = $SUBJECT_PREFIX.' – '.$name;
$body = "Time: $date\nIP: $ip\nUA: $ua\nName: $name\nEmail: $email\nCompany: $company\n---\nMessage:\n$message\n";
log_line('Composed subject='.$subject);

// ---------- Ngarkimi i konfigurimit SMTP ----------
$smtpConfig = null;
$smtpConfigPath = __DIR__.'/mail.config.php';
if(is_file($smtpConfigPath)){
  $loaded = include $smtpConfigPath; // duhet të kthejë array
  if(is_array($loaded) && !empty($loaded['smtp']['host']) && $loaded['smtp']['host'] !== 'smtp.example.com'){
    $smtpConfig = $loaded['smtp'];
    log_line('SMTP config detected host='.$smtpConfig['host']);
  } else {
    log_line('SMTP config present but host invalid (using mail())');
  }
} else {
  log_line('No mail.config.php (using mail())');
}

// ---------- Përpjekja për dërgim ----------
$sent = false; $used='mail';
if($smtpConfig){
  $autoload = __DIR__.'/vendor/autoload.php';
  if(is_file($autoload)){
    require_once $autoload;
    if(class_exists('PHPMailer\\PHPMailer\\PHPMailer')){
      try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = $smtpConfig['host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $smtpConfig['user'] ?? '';
        $mail->Password   = $smtpConfig['pass'] ?? '';
        $mail->Port       = (int)($smtpConfig['port'] ?? 587);
        $secure           = $smtpConfig['secure'] ?? 'tls';
        if(in_array($secure,['tls','ssl'],true)) $mail->SMTPSecure = $secure;
        $mail->CharSet    = 'UTF-8';
        $fromEmail = $smtpConfig['from_email'] ?? ('no-reply@'.$sendingDomain);
        $fromName  = $smtpConfig['from_name']  ?? 'Devycore';
        $mail->setFrom($fromEmail, $fromName);
        $mail->addAddress($TO);
        $mail->addReplyTo($email, $name);
        if(!empty($smtpConfig['bcc'])) $mail->addBCC($smtpConfig['bcc']);
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = $body;
        $mail->send();
        $sent = true; $used='smtp';
        log_line('SMTP send ok');
      } catch(Throwable $e){
        $smtpError = $e->getMessage();
        log_line('SMTP error: '.$smtpError);
      }
    } else {
      log_line('PHPMailer class missing (composer install skipped)');
    }
  } else {
    log_line('vendor/autoload.php missing (composer not run)');
  }
}

// Fallback nëse SMTP dështoi ose nuk ishte aktiv
if(!$sent){
  $headers = [];
  $headers[] = 'From: Devycore <no-reply@'.$sendingDomain.'>';
  $headers[] = 'Reply-To: '.$email;
  $headers[] = 'X-Mailer: PHP/'.phpversion();
  $sent = @mail($TO, $subject, $body, implode("\r\n", $headers));
  if($sent){
    log_line('Fallback mail() success');
  } else {
    log_line('Fallback mail() failed');
  }
}

// ---------- Përgjigja JSON ----------
if(!$sent){
  http_response_code(500);
  $errorCode = isset($smtpError) ? 'smtp_failed' : 'send_failed';
  $payload = ['ok'=>false,'error'=>$errorCode];
  if(isset($smtpError)) $payload['detail']=$smtpError; // ofro detaj për debug (mund hiqet në prodhim)
  echo json_encode($payload);
  log_line('Final failure error='.$errorCode);
} else {
  echo json_encode(['ok'=>true,'mode'=>$used]);
  log_line('Send success mode='.$used);
}

// Flush log në fund
if($logLines){
  @file_put_contents($LOG_FILE, implode(PHP_EOL,$logLines).PHP_EOL, FILE_APPEND);
}
