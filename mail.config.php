<?php
/**
 * mail.config.php
 * ------------------------------------------------------------
 * Konfigurim SMTP për contact.php
 * - Nëse HOST mbetet 'smtp.example.com' atëherë contact.php e injoron dhe përdor mail()
 * - Për ta mbajtur sekret: mos e commit kredencialin real (vendoseni në .gitignore nëse repo publike)
 * - Mund të shtoni edhe parametra p.sh. 'bcc' për arkiv apo 'reply_to_override'
 * ------------------------------------------------------------
 * FIELDS:
 *  host       - Host i ofruesit (p.sh. smtp.mailgun.org / smtp.gmail.com)
 *  port       - 587 (TLS), 465 (SSL), 25 (plain) – rekomandohet 587
 *  secure     - 'tls' ose 'ssl' ose '' (asnjë). MOS vendosni STARTTLS manualisht; PHPMailer e bën sipas vlerës.
 *  user/pass  - Kredencialet SMTP (username / password / API key në disa shërbime)
 *  from_email - Adresa From (duhet të jetë e verifikuar tek disa ofrues si Mailgun / SES)
 *  from_name  - Emri i afishuar si dërgues
 *  bcc        - (Opsional) adresë për kopje të fshehtë për arkiv / audit
 */
return [
  'smtp' => [
    'host' => 'smtp.example.com',      // Ndrysho me host real
    'port' => 587,                     // 587 TLS
    'secure' => 'tls',                 // tls | ssl | ''
    'user' => 'postmaster@example.com',// Ndrysho me username real
    'pass' => 'CHANGE_ME',             // Ndrysho me password real / API Key
    'from_email' => 'no-reply@devycore.com',
    'from_name'  => 'Devycore',
    'bcc' => '',                       // p.sh. archive@devycore.com
  ]
];
