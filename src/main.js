// =============================================================
// main.js – Frontend boot script për faqen Devycore
// -------------------------------------------------------------
// Përmbledhje:
//  - Inicializon smooth scrolling (Lenis)
//  - GSAP intro animations + ScrollTrigger reveal effects
//  - WebGL background (plane shader + particle field) me Three.js
//  - Ndërton dinamkisht seksionet: badges, services, work, stack, showcase
//  - Menaxhon formularët e kontaktit (desktop & mobile) me fetch POST JSON
//  - Mobile variant (strukturë alternative e DOM) me animime të veçanta
//  - SVG injeksion për ikonat sociale (desktop & mobile)
//  - Parallax i lehtë i kamerës dhe micro‑interactions për CTA
// -------------------------------------------------------------
// Shënime:
//  - Kujdes me DEBUG (vendose false në prodhim për konsolë më të pastër)
//  - Nëse rrisni volum të partikulave / segmenteve, monitoroni FPS
//  - Struktura është e ndarë në blloqe të komentuara më poshtë
// =============================================================

import './site.css';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import * as THREE from 'three';
gsap.registerPlugin(ScrollTrigger);

// -------------------------------------------------------------
// 1. Smooth Scroll (Lenis)
// -------------------------------------------------------------
const lenis = new Lenis({
  lerp: 0.11,
  smoothWheel: true,
  smoothTouch: false,
});
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// -------------------------------------------------------------
// 2. Year (footer) – (Server e vendos gjithashtu; ky është fallback / mobile)
// -------------------------------------------------------------
document.getElementById('year').textContent = new Date().getFullYear();

// -------------------------------------------------------------
// 3. Dynamic Badges (value propositions / capabilities)
// -------------------------------------------------------------
const badges = [
  'WebGL', 'AI Assisted', 'Headless CMS', 'Realtime Dashboards', 'Edge Compute', 'Automation', 'Design Systems', 'SEO Core', 'SSR/ISR', 'Type Safety', 'Security', 'Scalability'
];
const badgeRow = document.getElementById('badges');
for (const b of badges) {
  const el = document.createElement('div');
  el.className = 'badge';
  el.innerHTML = '<span class="pulse"></span>' + b;
  badgeRow.appendChild(el);
}

// -------------------------------------------------------------
// 4. (Legacy) Floating cards u hoqën – Orbit viz (nëse ekziston DOM)
// -------------------------------------------------------------
const orbitVizRingA = document.getElementById('ringA');
const orbitVizRingB = document.getElementById('ringB');
if(orbitVizRingA && orbitVizRingB){
  const nodesA = ['Perf','DX','AI','APIs','UX'];
  const nodesB = ['Scaling','Security','Observability','Integrations','Automation','Strategy'];
  const makeNodes = (arr, ringEl, radius) => {
    arr.forEach((label,i)=>{
      const n=document.createElement('div'); n.className='orb-node';
      const ang = (i/arr.length)*Math.PI*2;
      n.style.transform = `translate(-50%,-50%) rotate(${ang}rad) translateY(-${radius}px) rotate(${-ang}rad)`;
      n.textContent=label; ringEl.appendChild(n);
    });
  };
  makeNodes(nodesA, orbitVizRingA, 180);
  makeNodes(nodesB, orbitVizRingB, 260);
  gsap.from('.orb-node',{opacity:0, scale:0.4, stagger:0.08, duration:0.9, ease:'back.out(1.6)', delay:0.4});
}

// -------------------------------------------------------------
// 5. GSAP Entrance Animations (timeline fillon sapo ngarkohet)
// -------------------------------------------------------------
const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
tl.from('.site-header .brand', { y: -40, opacity: 0, duration: 0.9 })
  .from('.site-header nav a', { y: -20, opacity: 0, stagger: 0.05, duration: 0.6 }, '<0.15')
  .from('.hero-copy h2', { y: 60, opacity: 0, duration: 1.2 }, '-=0.2')
  .from('.hero-copy p', { y: 40, opacity: 0, duration: 0.9 }, '-=0.6')
  .from('.actions .btn', { y: 30, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.6')
  .from('.floating-card', { y: 40, opacity: 0, rotate: 4, duration: 0.9, stagger: 0.12, clearProps: 'all' }, '-=0.7');

// (Removed 3D tilt for img logo; could add subtle scale hover if desired)

// -------------------------------------------------------------
// 6. WebGL Scene (Plane Shader + Particle Field)
// -------------------------------------------------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 6);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bgScene'), antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// -- Plane shader (valëzim i lehtë për teksturë dinamike të sfondit)
const uniforms = {
  u_time: { value: 0 },
  u_res: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
};
const geometry = new THREE.PlaneGeometry(14, 14, 300, 300);
const material = new THREE.ShaderMaterial({
  transparent: true,
  uniforms,
  vertexShader: /* glsl */`
    varying vec2 vUv; uniform float u_time; 
    void main(){ vUv = uv; vec3 pos = position; float wob = sin(pos.x*0.45 + u_time*0.6)*0.12 + cos(pos.y*0.55 + u_time*0.5)*0.12; pos.z += wob; gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0); }
  `,
  fragmentShader: /* glsl */`
    varying vec2 vUv; uniform float u_time; 
    float noise(vec2 p){ return fract(sin(dot(p, vec2(23.43,54.34)))*34235.23); }
    void main(){
      vec2 uv = vUv; 
      float n = noise(uv*8. + u_time*0.1);
      float g = smoothstep(1.2, -0.4, distance(uv, vec2(0.4,0.5)) + n*0.25);
      vec3 col = mix(vec3(0.02,0.05,0.09), vec3(0.08,0.18,0.35), g);
      col += 0.25*vec3(0.1,0.25,0.6)*g;
      float vign = smoothstep(0.9,0.4,distance(uv, vec2(0.5)));
      col *= vign;
      gl_FragColor = vec4(col, 0.85);
    }
  `
});
const plane = new THREE.Mesh(geometry, material);
plane.rotation.x = -0.4;
scene.add(plane);

// -- Particle field (pika orbituese + rotacion Z)
const pGeo = new THREE.BufferGeometry();
const isMobile = window.matchMedia('(max-width: 780px)').matches;
const COUNT = isMobile ? 700 : 1600;
const positions = new Float32Array(COUNT * 3);
for (let i = 0; i < COUNT; i++) {
  const i3 = i * 3;
  positions[i3] = (Math.random() - 0.5) * 14;
  positions[i3 + 1] = (Math.random() - 0.5) * 8;
  positions[i3 + 2] = (Math.random() - 0.5) * 6;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const pMat = new THREE.PointsMaterial({ size: 0.035, color: 0x4c7dff, transparent: true, opacity: 0.6, depthWrite: false });
const points = new THREE.Points(pGeo, pMat);
scene.add(points);

// -- Animation loop (update uniforms + rotacion i plane & pikave)
const clock = new THREE.Clock();
function animate(){
  const t = clock.getElapsedTime();
  uniforms.u_time.value = t;
  points.rotation.y = t * 0.04;
  plane.rotation.y = Math.sin(t*0.1)*0.2;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// -- Resize handler (responsivitet i kamerës / renderer)
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_res.value.set(window.innerWidth, window.innerHeight);
});

// -------------------------------------------------------------
// 7. CTA Micro Interaction (hover ndryshon këndin e plane)
// -------------------------------------------------------------
const cta = document.getElementById('ctaTalk');
cta.addEventListener('mouseenter', () => {
  gsap.to(plane.rotation, { x: -0.55, duration: 0.6, ease: 'power3.out' });
});
cta.addEventListener('mouseleave', () => {
  gsap.to(plane.rotation, { x: -0.4, duration: 0.8, ease: 'elastic.out(1,0.4)' });
});

// -------------------------------------------------------------
// 8. Scroll Parallax i Kamerës (bazuar në progres total)
// -------------------------------------------------------------
lenis.on('scroll', ({ scroll, limit, velocity, direction }) => {
  const p = scroll / limit;
  gsap.to(camera.position, { z: 6 + p * 1.4, x: (p - 0.5)*0.6, duration: 0.6, overwrite: true });
});

// -------------------------------------------------------------
// 9. Services – Data driven rendering (shmang markup statik)
// -------------------------------------------------------------
const servicesData = [
  { title: 'Strategy & Discovery', desc: 'Workshops, market analysis, KPI definition & risk mapping.', tags: ['Audit','KPI','Roadmap'] },
  { title: 'UX/UI & Design Systems', desc: 'Wireframes, interactive prototypes, token systems, accessibility.', tags: ['Design Tokens','A11y','Prototyping'] },
  { title: 'Web Apps & Portals', desc: 'Reactive applications with high performance & strong SEO.', tags: ['SSR','SPA','Edge'] },
  { title: 'Business Systems', desc: 'ERP, CRM, Inventory, workflow automation & integrations.', tags: ['ERP','Automation','APIs'] },
  { title: 'Architecture & Scaling', desc: 'Domain driven, event driven, modular monolith / microservices.', tags: ['DDD','Events','Cloud'] },
  { title: 'Integrations & API', desc: 'Payments, auth, marketing, AI pipelines, messaging.', tags: ['OAuth','Webhooks','AI'] },
  { title: 'Performance & Security', desc: 'Profiling, caching, code splitting, hardening & monitoring.', tags: ['Perf','Security','Observability'] },
  { title: 'Continuous Evolution', desc: 'Refactoring, test coverage, technical debt reduction.', tags: ['Refactor','Tests','CI/CD'] }
];
const servicesGrid = document.getElementById('servicesGrid');
servicesData.forEach(s => {
  const card = document.createElement('div');
  card.className = 'service-card';
  card.innerHTML = `<div class="service-icon">${s.title.charAt(0)}</div><h4>${s.title}</h4><p>${s.desc}</p>`;
  const tags = document.createElement('div'); tags.className='tags';
  s.tags.forEach(t => { const tag = document.createElement('div'); tag.className='tag'; tag.textContent=t; tags.appendChild(tag); });
  card.appendChild(tags);
  servicesGrid.appendChild(card);
});

// -------------------------------------------------------------
// 10. Work (Case Studies) – Rindërtim dinamik + lazy fade për imazhet
// -------------------------------------------------------------
const workData = [
  { title: 'FinTech Dashboard', desc: 'Realtime risk & portfolio monitoring with latency <120ms.', meta: ['Realtime','WebSockets','DX'] },
  { title: 'Logistics Platform', desc: 'Route optimization & tracking with ERP integration.', meta: ['Routing','ERP','Events'] },
  { title: 'E-Commerce Core', desc: 'Headless architecture + personalization layer.', meta: ['Headless','CDN','Personalization'] },
  { title: 'Analytics Suite', desc: 'Data ingestion + business metrics visualization.', meta: ['Ingestion','Charts','ETL'] }
];
const workGrid = document.getElementById('workGrid');
// Image mapping reverted to local user-provided images under /images/bottom
// NOTE: Filenames normalized for Vercel deployment (no spaces, corrected typos)
const caseImages = {
  'FinTech Dashboard': { src: '/images/bottom/fintech.jpg', alt: 'FinTech dashboard visual' },
  'Logistics Platform': { src: '/images/bottom/logistics.jpg', alt: 'Logistics platform visual' },
  'E-Commerce Core': { src: '/images/bottom/ecommerce2.jpg', alt: 'E-Commerce core visual' },
  'Analytics Suite': { src: '/images/bottom/analytics.jpg', alt: 'Analytics suite visual' }
};
workData.forEach(w => {
  const el = document.createElement('div'); el.className='case';
  const imgData = caseImages[w.title];
  if(imgData){
    el.innerHTML = `<div class='case-media'><img src="${imgData.src}" alt="${imgData.alt}" loading="lazy" decoding="async"/></div><div class='case-body'><h4>${w.title}</h4><p>${w.desc}</p><div class='case-meta'>${w.meta.map(m=>`<span>${m}</span>`).join('')}</div></div>`;
  } else {
    el.innerHTML = `<div class='case-media placeholder'></div><div class='case-body'><h4>${w.title}</h4><p>${w.desc}</p><div class='case-meta'>${w.meta.map(m=>`<span>${m}</span>`).join('')}</div></div>`;
  }
  const imgTag = el.querySelector('img');
  if(imgTag){
    imgTag.style.opacity='0';
    imgTag.style.transition='opacity .6s ease';
    imgTag.addEventListener('load', ()=>{ imgTag.style.opacity='1'; });
    imgTag.addEventListener('error', ()=>{ imgTag.closest('.case-media')?.classList.add('error'); });
  }
  workGrid.appendChild(el);
});

// -------------------------------------------------------------
// 11. Stack (kategoritë teknologjike) – IIFE encapsulation
// -------------------------------------------------------------
(function(){
  const stack = [
    { cat:'Core Runtime', items:['Node.js','Deno','Bun','Java 21','Python'] },
    { cat:'Frontend Experience', items:['React','Next.js','Vite','Svelte','Astro'] },
    { cat:'Styling & UI', items:['Tailwind','CSS Modules','Storybook','Radix'] },
    { cat:'Data & Storage', items:['PostgreSQL','Redis','Elastic','ClickHouse','S3'] },
    { cat:'Integration', items:['GraphQL','REST','tRPC','gRPC','WebSockets'] },
    { cat:'Architecture', items:['CQRS','Event Sourcing','DDD','Hexagonal'] },
    { cat:'Infra / DevOps', items:['Docker','Kubernetes','Terraform','GitHub Actions','Cloudflare'] },
    { cat:'Observability', items:['OpenTelemetry','Prometheus','Grafana','Sentry','Jaeger'] },
    { cat:'Quality & Productivity', items:['Jest','Playwright','Vitest','ESLint','Prettier'] },
    { cat:'Security', items:['OWASP','ZAP','JWT','mTLS','Keycloak'] },
    { cat:'AI & Data', items:['LLM APIs','LangChain','Vector DB','Embeddings','Pipelines'] },
    { cat:'Performance', items:['CDN Edge','ISR/SSG','Code Split','Caching','Profiling'] }
  ];
  const grid = document.getElementById('stackGrid');
  if(!grid) return;
  stack.forEach(s=>{
    const card=document.createElement('div'); card.className='stack-card';
    card.innerHTML = `<h4>${s.cat}</h4>`;
    const ul=document.createElement('ul'); ul.className='stack-items';
    s.items.forEach(i=>{ const li=document.createElement('li'); li.textContent=i; ul.appendChild(li); });
    card.appendChild(ul); grid.appendChild(card);
  });
})();

// -------------------------------------------------------------
// 12. Showcase Cards (hero grid) – fade + indicator cycling
// -------------------------------------------------------------
(function(){
  const grid = document.getElementById('scGrid');
  if(!grid) return;
  // Directly use provided images in /images folder; titles & descriptions aligned with filenames
  // NOTE: Filenames with spaces need encoding for URL usage
  const items = [
    { title:'SaaS Platform', desc:'High-performance subscription & billing UX', img:'/images/saas.jpg', url:'#' },
    { title:'E-Commerce', desc:'Headless storefront experience optimization', img:'/images/ecommerce.jpg', url:'#' },
    { title:'Portfolio', desc:'Personal brand & case study presentation', img:'/images/portfolio.jpg', url:'#' },
    { title:'Business System', desc:'Internal operations & workflow system', img:'/images/business-system.jpg', url:'#' }
  ];
  // Preload then render with fade-in and indicator cycling
  let loaded = 0;
  const total = items.length;
  const render = () => {
    items.forEach((it,i)=>{
      const el=document.createElement('a'); el.className='sc-item'; el.href=it.url; el.setAttribute('aria-label',it.title);
      el.style.opacity='0';
      el.innerHTML = `<div class=\"sc-preview\" style=\"background-image:url('${it.img}')\"></div><h5>${it.title}</h5><p>${it.desc}</p>`;
      grid.appendChild(el);
      setTimeout(()=>{ el.style.transition='opacity .9s ease'; el.style.opacity='1'; }, 60*i);
    });
    const ind = document.getElementById('scIndicator');
    if(ind){ items.forEach((_,i)=>{ const d=document.createElement('span'); if(i===0)d.className='active'; ind.appendChild(d); }); }
    let idx=0; setInterval(()=>{ idx=(idx+1)%items.length; ind?.querySelectorAll('span').forEach((s,i)=> s.classList.toggle('active', i===idx)); }, 2600);
  };
  items.forEach(it=>{ const img=new Image(); img.onload=()=>{ if(++loaded===total) render(); }; img.onerror=()=>{ if(++loaded===total) render(); }; img.src=it.img; });
// Inject social icons (contact section)
(function(){
  const bar = document.getElementById('socialBar');
  if(!bar) return;
  const icons = [
    { c:'s-email', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 5h18v14H3V5Z"/><path d="m3 5 9 8 9-8"/></svg>' },
    { c:'s-ln', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/><path d="M2 9h4v12H2zM9 9h4v2.7S14 9 17 9s4 2.2 4 5.8V21h-4v-5.5c0-2.1-.9-3.2-2.4-3.2-1.4 0-2.1 1.1-2.1 3.2V21H9z"/></svg>' },
    { c:'s-fb', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 8h2.5V4H15c-3 0-5 2.2-5 5v2H7v4h3v7h4v-7h3.1l.9-4H14v-2c0-.6.4-1 1-1Z"/></svg>' },
    { c:'s-ig', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1"/></svg>' },
    { c:'s-tt', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 3h3c.2 2.2 1.8 3.8 4 4v3c-1.6 0-3-.5-4-1.2v5.2c0 4-2.6 6.8-6.7 6.8-2.8 0-5.3-1.7-6.3-4.2l3.2-.9c.4 1.2 1.6 2 3 2 2.1 0 3.3-1.6 3.3-3.7V5.4c-.7.2-1.7.3-2.5.3V3c1 0 2-.1 3-.3Z"/></svg>' },
    { c:'s-yt', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21.5 7.2c-.2-1.2-1-2-2.1-2.2C17.3 4.5 12 4.5 12 4.5s-5.3 0-7.4.5c-1.1.2-1.9 1-2.1 2.2C2 9 2 12 2 12s0 3 .5 4.8c.2 1.2 1 2 2.1 2.2 2.1.5 7.4.5 7.4.5s5.3 0 7.4-.5c1.1-.2 1.9-1 2.1-2.2.5-1.8.5-4.8.5-4.8s0-3-.5-4.8Z"/><path d="m10 9 5 3-5 3V9Z"/></svg>' },
    { c:'s-wa', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 20.5 6.6 16A8 8 0 1 1 20 12a8 8 0 0 1-12.9 6.2L5 20.5Z"/><path d="M8.5 10.5c.2 3 2.6 5.1 5 5"/></svg>' },
    { c:'s-vb', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2c5.5 0 10 3.9 10 8.7 0 2.7-1.6 5.1-4.1 6.6L19 22l-5.2-3.2c-.6.1-1.1.1-1.8.1-5.5 0-10-3.9-10-8.7S6.5 2 12 2Z"/><path d="M8 9h2l2 6 2-6h2"/></svg>' }
  ];
  icons.forEach(ic=>{ const el=bar.querySelector('.'+ic.c); if(el) el.innerHTML=ic.svg; });
})();
})();

// -------------------------------------------------------------
// 13. Scroll Reveal (GSAP) për elementët kryesorë
// -------------------------------------------------------------
gsap.utils.toArray('.service-card, .case, .stage, .foot-col').forEach(el => {
  gsap.from(el, { y: 60, opacity:0, duration:0.9, ease:'power3.out', scrollTrigger:{ trigger: el, start:'top 85%' } });
});

// -------------------------------------------------------------
// 14. Mobile Navigation (hamburger + slide panel)
// -------------------------------------------------------------
const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');
navToggle?.addEventListener('click', () => {
  document.body.classList.toggle('nav-open');
  mobileNav.classList.toggle('open');
  if(mobileNav.classList.contains('open')){
    gsap.fromTo('#mobileNav a', { y:30, opacity:0 }, { y:0, opacity:1, stagger:0.08, duration:0.6, ease:'power3.out' });
  }
});
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', ()=>{ document.body.classList.remove('nav-open'); mobileNav.classList.remove('open'); }));

// -------------------------------------------------------------
// 15. Formulari i Kontaktit – Handler i ripërdorshëm
//     - Validim bazik
//     - Honeypot kontroll
//     - Fetch POST -> contact.php (JSON)
//     - Debug grup në console kur DEBUG=true
// -------------------------------------------------------------
function attachContactHandler(formId, successId, errorId){
  const f = document.getElementById(formId);
  if(!f) return;
  const successEl = document.getElementById(successId);
  const errorEl = errorId ? document.getElementById(errorId) : null;
  const DEBUG = true; // toggle to false in production
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(f);
    const name = (fd.get('name')||'').toString().trim();
    const email = (fd.get('email')||'').toString().trim();
    const message = (fd.get('message')||'').toString().trim();
    const honeypot = (fd.get('website')||'').toString().trim();
    const emailValid = /.+@.+\..+/.test(email);
    if(honeypot || !name || !emailValid || !message){
      gsap.fromTo(f, { x: -8 }, { x:8, repeat:5, yoyo:true, duration:0.05, ease:'power1.inOut' });
      if(errorEl){ errorEl.style.display='block'; errorEl.textContent='Plotëso fushat e sakta.'; }
      return;
    }
    const btn = f.querySelector('button[type="submit"], .btn[type="submit"]');
    if(btn) btn.disabled = true;
    if(successEl) successEl.style.display='none';
    if(errorEl){ errorEl.style.display='none'; }
    try {
      const res = await fetch(f.getAttribute('action')||'/contact.php', {
        method: 'POST',
        body: fd
      });
      let rawText = '';
      try { rawText = await res.text(); } catch(_){}
      let data;
      try { data = JSON.parse(rawText); } catch { data = { ok:false, parse_error:true }; }
      if(DEBUG){
        console.groupCollapsed(`[ContactDebug] ${formId}`);
        console.log('Status:', res.status);
        console.log('Raw:', rawText);
        console.log('Parsed:', data);
        console.groupEnd();
      }
      if(data.ok){
        if(successEl){ successEl.style.display='block'; successEl.setAttribute('role','status'); }
        f.reset();
      } else {
        if(errorEl){
          let msg = 'Dështoi dërgimi. Provo përsëri.';
          if(data.error === 'invalid_fields') msg = 'Fushat nuk janë të vlefshme.';
            else if(data.error === 'too_long') msg = 'Teksti është shumë i gjatë.';
            else if(data.error === 'send_failed') msg = 'Serveri nuk dërgoi email. Konfigurimi i mail mungon.';
            else if(data.error === 'smtp_failed') msg = 'SMTP dështoi – kontrollo kredencialet.';
            else if(data.parse_error) msg = 'Serveri nuk ktheu JSON (ndoshta 404 ose PHP jo aktiv).';
          msg += ` (status ${res.status})`;
          errorEl.textContent = msg; errorEl.style.display='block';
        }
        gsap.fromTo(f, { x: -10 }, { x:10, repeat:6, yoyo:true, duration:0.05, ease:'power1.inOut' });
      }
    } catch(err){
      if(errorEl){ errorEl.textContent='Gabim rrjeti.'; errorEl.style.display='block'; }
      gsap.fromTo(f, { x: -10 }, { x:10, repeat:6, yoyo:true, duration:0.05, ease:'power1.inOut' });
      if(DEBUG){ console.error('[ContactDebug] Fetch error', err); }
    } finally {
      if(btn) btn.disabled = false;
    }
  });
}
attachContactHandler('contactForm','formSuccess','formError');
attachContactHandler('mContactForm','mSent','mError');

// -------------------------------------------------------------
// 16. Smooth Anchor Links (override default jump)
// -------------------------------------------------------------
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if(target){
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 40;
      lenis.scrollTo(top, { duration: 1, easing: t=>1- Math.pow(1-t,3) });
    }
  });
});

// (Legacy cleanup placeholder)

// -------------------------------------------------------------
// 17. Mobile Variant Activation – Strukturë dhe animime të veçanta
// -------------------------------------------------------------
(function(){
  const isMobile = window.matchMedia('(max-width: 780px)').matches;
  const root = document.getElementById('mobileRoot');
  if(!isMobile || !root) return;
  // Show mobile root & hide desktop overlay
  root.style.display='flex';
  document.querySelector('.overlay')?.setAttribute('hidden','true');
  // Pills from badges array
  const pillsContainer = document.getElementById('mPills');
  if(pillsContainer){
    badges.slice(0,10).forEach(p=>{ const pill=document.createElement('div'); pill.className='pill fade-in'; pill.innerHTML='<span class="dot"></span>'+p; pillsContainer.appendChild(pill); });
  }
  // Services carousel
  const sc = document.getElementById('mServicesCarousel');
  if(sc){
    servicesData.forEach(s=>{ const c=document.createElement('div'); c.className='s-card fade-in'; c.innerHTML=`<h3>${s.title}</h3><p>${s.desc}</p><span class='badge-mini'>${s.tags[0]}</span>`; sc.appendChild(c); });
  }
  // Work list
  const wl = document.getElementById('mWorkList');
  if(wl){
    workData.forEach(w=>{ const item=document.createElement('div'); item.className='w-item fade-in'; item.innerHTML=`<h4>${w.title}</h4><p>${w.desc}</p><div class='w-meta'>${w.meta.map(m=>`<span>${m}</span>`).join('')}</div>`; wl.appendChild(item); });
  }
  // Year
  const y = document.getElementById('mYear'); if(y) y.textContent=new Date().getFullYear();
  // Hamburger
  const ham = document.getElementById('mHamburger');
  const nav = document.getElementById('mNav');
  ham?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    document.body.classList.toggle('nav-open', open);
    ham.setAttribute('aria-expanded', open?'true':'false');
    nav.setAttribute('aria-hidden', open?'false':'true');
    if(open){
      nav.querySelectorAll('a').forEach((a,i)=>{ gsap.fromTo(a,{y:40,opacity:0},{y:0,opacity:1,duration:.7,delay:.05*i,ease:'power3.out'}); });
    }
  });
  nav?.querySelectorAll('a').forEach(a=> a.addEventListener('click',()=>{ nav.classList.remove('open'); document.body.classList.remove('nav-open'); ham.setAttribute('aria-expanded','false'); nav.setAttribute('aria-hidden','true'); }));
  // Inject mobile social icons SVG
  const mSocial = document.getElementById('mSocial');
  if(mSocial){
    const mIcons = [
      { c:'s-email', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 5h18v14H3V5Z"/><path d="m3 5 9 8 9-8"/></svg>' },
      { c:'s-ln', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/><path d="M2 9h4v12H2zM9 9h4v2.7S14 9 17 9s4 2.2 4 5.8V21h-4v-5.5c0-2.1-.9-3.2-2.4-3.2-1.4 0-2.1 1.1-2.1 3.2V21H9z"/></svg>' },
      { c:'s-fb', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M15 8h2.5V4H15c-3 0-5 2.2-5 5v2H7v4h3v7h4v-7h3.1l.9-4H14v-2c0-.6.4-1 1-1Z"/></svg>' },
      { c:'s-ig', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1"/></svg>' },
      { c:'s-tt', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 3h3c.2 2.2 1.8 3.8 4 4v3c-1.6 0-3-.5-4-1.2v5.2c0 4-2.6 6.8-6.7 6.8-2.8 0-5.3-1.7-6.3-4.2l3.2-.9c.4 1.2 1.6 2 3 2 2.1 0 3.3-1.6 3.3-3.7V5.4c-.7.2-1.7.3-2.5.3V3c1 0 2-.1 3-.3Z"/></svg>' },
      { c:'s-yt', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21.5 7.2c-.2-1.2-1-2-2.1-2.2C17.3 4.5 12 4.5 12 4.5s-5.3 0-7.4.5c-1.1.2-1.9 1-2.1 2.2C2 9 2 12 2 12s0 3 .5 4.8c.2 1.2 1 2 2.1 2.2 2.1.5 7.4.5 7.4.5s5.3 0 7.4-.5c1.1-.2 1.9-1 2.1-2.2.5-1.8.5-4.8.5-4.8s0-3-.5-4.8Z"/><path d="m10 9 5 3-5 3V9Z"/></svg>' },
      { c:'s-wa', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 20.5 6.6 16A8 8 0 1 1 20 12a8 8 0 0 1-12.9 6.2L5 20.5Z"/><path d="M8.5 10.5c.2 3 2.6 5.1 5 5"/></svg>' },
      { c:'s-vb', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2c5.5 0 10 3.9 10 8.7 0 2.7-1.6 5.1-4.1 6.6L19 22l-5.2-3.2c-.6.1-1.1.1-1.8.1-5.5 0-10-3.9-10-8.7S6.5 2 12 2Z"/><path d="M8 9h2l2 6 2-6h2"/></svg>' }
    ];
    mIcons.forEach(ic=>{ const el=mSocial.querySelector('.'+ic.c); if(el) el.innerHTML=ic.svg; });
  }
  // Scroll reveal simple
  const reveal = () => {
    document.querySelectorAll('#mobileRoot .fade-in').forEach(el=>{
      if(el.getBoundingClientRect().top < window.innerHeight - 60 && !el.dataset.revealed){
        el.dataset.revealed='1';
        gsap.to(el,{y:0,opacity:1,duration:.8,ease:'power3.out'});
      }
    });
  };
  window.addEventListener('scroll', reveal, { passive:true });
  reveal();
})();

// -------------------------------------------------------------
// 18. Mobile Canvas Background (dots + lines) & Social reveal
// -------------------------------------------------------------
(function(){
  const isMobile = window.matchMedia('(max-width: 780px)').matches;
  if(!isMobile) return;
  const canvas = document.getElementById('mBgCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;
  window.addEventListener('resize', ()=>{ w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });
  const DOTS = 55;
  const dots = Array.from({length:DOTS},()=>({
    x: Math.random()*w,
    y: Math.random()*h,
    r: 1.2+Math.random()*2.2,
    vx: (-0.3+Math.random()*0.6),
    vy: (-0.3+Math.random()*0.6)
  }));
  function tick(){
    ctx.clearRect(0,0,w,h);
    // gradient fade
    const grad = ctx.createLinearGradient(0,0,w,h);
    grad.addColorStop(0,'rgba(76,125,255,0.25)');
    grad.addColorStop(1,'rgba(255,77,103,0.18)');
    ctx.fillStyle = 'rgba(6,8,11,0.55)';
    ctx.fillRect(0,0,w,h);
    // links
    for(let i=0;i<DOTS;i++){
      for(let j=i+1;j<DOTS;j++){
        const a = dots[i], b = dots[j];
        const dx=a.x-b.x, dy=a.y-b.y; const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<140){
          const alpha = 1 - dist/140;
            ctx.strokeStyle = `rgba(120,170,255,${alpha*0.25})`;
            ctx.lineWidth=1;
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
    // dots
    dots.forEach(d=>{
      d.x+=d.vx; d.y+=d.vy;
      if(d.x<0||d.x>w) d.vx*=-1;
      if(d.y<0||d.y>h) d.vy*=-1;
      const pulse = 0.6 + Math.sin(Date.now()/700 + d.x)*0.4;
      ctx.beginPath();
      ctx.fillStyle=`rgba(255,255,255,${0.35*pulse})`;
      ctx.arc(d.x,d.y,d.r*pulse,0,Math.PI*2);
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  tick();

  // Animate socials after nav open
  const nav = document.getElementById('mNav');
  const ham = document.getElementById('mHamburger');
  if(nav && ham){
    ham.addEventListener('click',()=>{
      if(nav.classList.contains('open')){
        const socials = nav.querySelectorAll('.social-row .soc');
        socials.forEach((s,i)=> gsap.fromTo(s,{y:30,opacity:0},{y:0,opacity:1,duration:.6,delay:.05*i+0.2,ease:'power3.out'}));
      }
    });
  }
})();
