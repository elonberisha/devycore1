## Devycore Portfolio

> Portofolio / studio site me WebGL, animacione GSAP, smooth scroll, seksione dinamike dhe backend PHP për kontakt (+ SMTP opsional).

---
## Përmbledhje
- Hero me shader plane & particle field (Three.js)
- Animacione hyrëse dhe reveal (GSAP + ScrollTrigger)
- Smooth scroll & parallax (Lenis)
- Seksione dinamike (Services, Work, Stack, Process, Contact) të ndërtuara nga arrays JS
- Dy variante UI: Desktop overlay + Mobile root strukturë alternative
- Formular kontakti (desktop & mobile) -> PHP endpoint `contact.php` (JSON responses, honeypot, logging, SMTP fallback)
- SEO i avancuar: Meta, OpenGraph, Twitter, JSON-LD Organization & Website
- Vite build + manifest integrim automatik në `index.php`
- `.htaccess` për rewrite, cache, headers sigurie & fallback

---
## Teknologji Kryesore
| Shtresa | Teknologji |
|---------|------------|
| Dev Bundler | Vite |
| WebGL / Vizual | Three.js (shader plane + particles) |
| Animacione | GSAP + ScrollTrigger |
| Scrolling | Lenis |
| Backend Kontakt | PHP + opsional PHPMailer |
| Deploy Target | Shared hosting (Hostinger) ose VPS |

---
## Strukturë Skedarësh (thelbësore)
```
index.php            # Entry point (PHP): meta, seksionet, dynamic manifest load
contact.php          # Endpoint POST -> dërgim email (SMTP / mail()) + JSON
mail.config.php      # Konfigurim SMTP (host, port, user, pass, from)
src/main.js          # Logjika front: animacione, DOM build, form handling
mobile.css           # Stile për variantin mobile
dist/                # Build output (vite build) – hash files + manifest.json
vendor/              # Composer (PHPMailer) kur SMTP aktivizohet
.htaccess            # Rewrite, cache, security headers
mail.log             # (Opsion) log send attempts (krijohet runtime)
images/              # Asset-e statike
```

---
## Zhvillim Lokalisht
```bash
npm install
npm run dev
```
Hape: http://localhost:5173

Build prod:
```bash
npm run build
```
Krijon `dist/manifest.json` që lexohet në `index.php` (automatikisht zëvendëson `<script src="/src/main.js">` me bundle hash / CSS).

---
## Formulari i Kontaktit
Frontend (`main.js`):
1. Lexon formularin, validon fushat.
2. Dërgon POST `fetch` te `contact.php`.
3. Merr JSON -> shfaq sukses ose gabim.
4. Honeypot field: `website` (nëse mbushet => bot, kthehet sukses i heshtur).

`contact.php`:
- Sanitizim i input-eve, validim email regex & limite gjatësie.
- Ndërton body me IP, UA, kohë.
- Përpiqet SMTP nëse `mail.config.php` ka host ≠ smtp.example.com dhe ekziston `vendor/autoload.php`.
- Në dështim -> fallback `mail()`.
- Log në `mail.log` (mund ta fikësh duke mos lejuar shkrim / ose fshini kodin e logimit).
- JSON Codes:
	- `ok:true, mode:smtp` ose `mode:mail`
	- `invalid_fields`, `too_long`, `smtp_failed`, `send_failed`, `method_not_allowed`

DEBUG: Në `main.js` brenda `attachContactHandler` -> `const DEBUG = true;` (vendose `false` në prodhim).

---
## SMTP Konfigurim
1. `composer require phpmailer/phpmailer`
2. Edizo `mail.config.php`:
```php
'host' => 'smtp.hostinger.com',
'port' => 587,
'secure' => 'tls',
'user' => 'info@devycore.com',
'pass' => 'PASSWORD',
'from_email' => 'info@devycore.com',
'from_name' => 'Devycore'
```
3. DNS: Siguro `SPF`, `DKIM`, `DMARC` për domain.
4. Testo formën (Network -> contact.php -> JSON response).

Nëse `smtp_failed`: kontrollo host, port, TLS/SSL, firewall ose kredenciale.

---
## Deploy në Hostinger (Hapat Kryesorë)
1. Build lokalisht: `npm run build`
2. (Opsional) composer require phpmailer/phpmailer -> ngarko `vendor/`
3. Ngarko në `public_html`: `index.php`, `contact.php`, `mail.config.php`, `dist/`, `images/`, `mobile.css`, `.htaccess`, (vendor/ nëse SMTP).
4. Fik DEBUG (vendos `DEBUG=false`).
5. Siguro PHP 8.2+ (hPanel > PHP settings).
6. Krijo mailbox `info@devycore.com` ose përdor ofrues të jashtëm.
7. Test: plotëso formularin -> kontrollo përgjigjen JSON & email.

---
## .htaccess (Përmbledhje Funksionesh)
- Rewrite fallback -> `index.php`
- Deny akses për: `mail.config.php`, composer / package files
- Cache afatgjatë për `/dist/*.js|css` (immutable, hashed)
- Security headers (X-Frame-Options, HSTS, etj.)
- Compression & expiration policies

---
## Siguria & Mirëmbajtja
- Fshih kredencialet SMTP (mos commit pass real në repo publik)
- Monitoro `mail.log` (rota ose fike pas testimit)
- Shto Cloudflare për SSL / WAF shtesë / caching global
- Rate limiting i thjeshtë (mund të shtohet – kërko nëse duhet)
- Kontrollo nëse `mail()` është aktiv (nëse jo, detyro SMTP)

---
## Optimizime të Mëvonshme
- Code splitting + dynamic import për Three.js (lazy load hero vizual pasi LCP të kalojë)
- Critical CSS extraction (inline above the fold)
- Service Worker për asset offline / warm shell
- Structured Data shtesë për projekte (`CreativeWork` / `SoftwareApplication`)
- Dark / Light theme toggle (prefers-color-scheme)
- Rate limit + simple in-memory cache për kontakt

---
## Troubleshooting Shpejt
| Situata | Kontrollo |
|---------|-----------|
| Form parse_error | Server s'ekzekuton PHP (mospërputhje path / 404) |
| smtp_failed | Kredenciale, port, TLS, bllok firewall |
| send_failed | mail() i ç'aktivizuar – aktivizo SMTP |
| Assets 404 dist | Nuk u ngarkua `dist/` ose build s'është bërë |
| Ikona bosh sociale | main.js nuk u ekzekutua (console errors) |

---
## Komanda të Shpejta
```bash
# Development
npm run dev

# Production build
npm run build

# PHPMailer
composer require phpmailer/phpmailer
```

---
## Licenca
Kod demonstrues privat / intern – përshtate sipas nevojës për publikim.

---
## Status
Functional prototype i kompletuar me backend kontakt + SEO + strukturë hostimi.

---
Nëse të duhen: rate limiting, lazy load për Three.js, ose monitorim analitik – kërko dhe shtojmë.
