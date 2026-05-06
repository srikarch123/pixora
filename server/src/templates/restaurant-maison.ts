// Maison Noir–style fine dining restaurant templates — 4 color/layout variants
import type { BusinessIntake, GeneratedContent } from "../types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MCtx = { intake: BusinessIntake; content: GeneratedContent; [k: string]: any };
export type MaisonRenderer = (ctx: MCtx) => string;

const esc = (v = "") =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const splitHeadline = (h: string): [string, string] => {
  const w = h.split(" ");
  if (w.length < 3) return [h, ""];
  const m = Math.ceil(w.length / 2);
  return [w.slice(0, m).join(" "), w.slice(m).join(" ")];
};

const splitMenu = (offs: GeneratedContent["offerings"]) => {
  const n = offs.length;
  if (n <= 3) return { starters: offs, mains: [] as typeof offs, desserts: [] as typeof offs };
  const a = Math.ceil(n / 3);
  const b = Math.ceil((n * 2) / 3);
  return { starters: offs.slice(0, a), mains: offs.slice(a, b), desserts: offs.slice(b) };
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/* ── PALETTE ── */
interface P { bg: string; bg2: string; bg3: string; ac: string; acL: string; acD: string; cr: string; crD: string; mu: string; tint: string }
const PAL: Record<string, P> = {
  luxe:    { bg:"#0a0804",bg2:"#111009",bg3:"#1a1710",ac:"#c9a84c",acL:"#e8c97a",acD:"#8a6d2e",cr:"#f5f0e8",crD:"#d4ccc0",mu:"#7a7468",tint:"rgba(139,26,26,.08)" },
  azure:   { bg:"#060e1a",bg2:"#0a1425",bg3:"#0e1c32",ac:"#4a90d9",acL:"#7ab0e8",acD:"#2d6aab",cr:"#e8f0f8",crD:"#b0c8e0",mu:"#687888",tint:"rgba(74,144,217,.08)" },
  rouge:   { bg:"#0e0608",bg2:"#160a0b",bg3:"#1c1012",ac:"#c04040",acL:"#de6a6a",acD:"#8a2828",cr:"#f8eeee",crD:"#d8c0c0",mu:"#7a6868",tint:"rgba(192,64,64,.1)" },
  verdant: { bg:"#060e09",bg2:"#0a1410",bg3:"#101c14",ac:"#6aab8e",acL:"#96c8b0",acD:"#3d7a5e",cr:"#eef4f0",crD:"#bcd0c4",mu:"#6a7870",tint:"rgba(106,171,142,.08)" },
};

/* ── CSS ── */
export const buildMaisonCss = (p: P): string => `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:${p.bg};--bg2:${p.bg2};--bg3:${p.bg3};--ac:${p.ac};--acL:${p.acL};--acD:${p.acD};--cr:${p.cr};--crD:${p.crD};--mu:${p.mu}}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--cr);font-family:'Tenor Sans',sans-serif;overflow-x:hidden;cursor:none}
.cursor{width:12px;height:12px;border:1.5px solid var(--ac);border-radius:50%;position:fixed;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:transform .15s}
.cursor-trail{width:40px;height:40px;border:.5px solid rgba(201,168,76,.25);border-radius:50%;position:fixed;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:transform .4s}
nav{position:fixed;top:0;left:0;right:0;z-index:1000;display:flex;align-items:center;justify-content:space-between;padding:2rem 4rem;transition:background .5s,padding .4s}
nav.scrolled{background:${p.bg}f2;backdrop-filter:blur(12px);padding:1.2rem 4rem;border-bottom:.5px solid color-mix(in srgb,var(--ac) 30%,transparent)}
.nav-logo{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:300;letter-spacing:.15em;color:var(--ac);text-decoration:none}
.nav-links{display:flex;gap:3rem;list-style:none}
.nav-links a{font-size:.68rem;letter-spacing:.2em;text-transform:uppercase;color:var(--crD);text-decoration:none;position:relative;transition:color .3s}
.nav-links a::after{content:'';position:absolute;bottom:-4px;left:0;right:0;height:.5px;background:var(--ac);transform:scaleX(0);transition:transform .3s}
.nav-links a:hover{color:var(--ac)}.nav-links a:hover::after{transform:scaleX(1)}
.nav-reserve{font-size:.63rem;letter-spacing:.25em;text-transform:uppercase;color:var(--bg);background:var(--ac);border:none;padding:.7rem 1.6rem;cursor:none;transition:background .3s,transform .2s}
.nav-reserve:hover{background:var(--acL);transform:scale(1.03)}
.hero{height:100vh;display:flex;flex-direction:column;justify-content:flex-end;padding:0 4rem 5rem;position:relative;overflow:hidden}
.hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 70% 40%,${p.tint} 0%,transparent 60%),radial-gradient(ellipse at 20% 80%,rgba(201,168,76,.04) 0%,transparent 50%),linear-gradient(160deg,${p.bg} 0%,${p.bg2} 50%,${p.bg3} 100%)}
.hero-noise{position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");opacity:.4}
.hero-line{position:absolute;top:0;left:50%;width:.5px;height:120px;background:linear-gradient(to bottom,transparent,var(--ac));opacity:0;animation:lineDown 1.5s ease forwards .3s;transform-origin:top}
@keyframes lineDown{to{opacity:1}}
.hero-eyebrow{font-size:.63rem;letter-spacing:.35em;text-transform:uppercase;color:var(--ac);margin-bottom:1.5rem;opacity:0;animation:fadeUp 1s ease forwards .6s}
.hero-title{font-family:'Cormorant Garamond',serif;font-size:clamp(4rem,10vw,9rem);font-weight:300;line-height:.9;letter-spacing:-.02em;max-width:900px;opacity:0;animation:fadeUp 1s ease forwards .9s}
.hero-title em{font-style:italic;color:var(--ac);display:block}
.hero-sub{display:flex;align-items:center;gap:2rem;margin-top:2.5rem;opacity:0;animation:fadeUp 1s ease forwards 1.2s}
.hero-sub p{font-size:.73rem;letter-spacing:.15em;color:var(--mu);text-transform:uppercase}
.hero-divider{width:60px;height:.5px;background:var(--acD)}
.hero-scroll{position:absolute;right:4rem;bottom:4rem;display:flex;flex-direction:column;align-items:center;gap:.5rem;opacity:0;animation:fadeUp 1s ease forwards 1.5s}
.hero-scroll span{font-size:.53rem;letter-spacing:.3em;text-transform:uppercase;color:var(--mu);writing-mode:vertical-rl}
.scroll-line{width:.5px;height:60px;background:linear-gradient(to bottom,var(--acD),transparent);animation:scrollPulse 2s ease infinite}
@keyframes scrollPulse{0%,100%{opacity:.3;transform:scaleY(1)}50%{opacity:1;transform:scaleY(1.2)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
.intro{display:grid;grid-template-columns:1fr 2px 1fr;align-items:center;padding:5rem 4rem;border-top:.5px solid color-mix(in srgb,var(--ac) 18%,transparent);border-bottom:.5px solid color-mix(in srgb,var(--ac) 18%,transparent);gap:4rem}
.intro-divider{background:color-mix(in srgb,var(--ac) 22%,transparent);height:120px;align-self:center}
.intro-quote{font-family:'Cormorant Garamond',serif;font-size:clamp(1.2rem,2.5vw,1.8rem);font-weight:300;font-style:italic;color:var(--cr);line-height:1.5}
.intro-text{font-size:.78rem;line-height:1.9;color:var(--mu);letter-spacing:.05em}
.section-header{display:flex;align-items:center;gap:2rem;margin-bottom:4rem}
.section-tag{font-size:.58rem;letter-spacing:.4em;text-transform:uppercase;color:var(--ac)}
.section-line{flex:1;height:.5px;background:color-mix(in srgb,var(--ac) 22%,transparent)}
.section-num{font-family:'Cormorant Garamond',serif;font-size:.9rem;color:var(--acD);font-style:italic}
.menu-sec{padding:7rem 4rem}
.menu-title{font-family:'Cormorant Garamond',serif;font-size:clamp(2.5rem,5vw,4.5rem);font-weight:300;margin-bottom:1rem}
.menu-title em{font-style:italic;color:var(--ac)}
.menu-intro{font-size:.76rem;color:var(--mu);letter-spacing:.08em;margin-bottom:4rem;max-width:520px}
.menu-tabs{display:flex;gap:0;margin-bottom:3rem;border-bottom:.5px solid color-mix(in srgb,var(--ac) 22%,transparent)}
.tab{font-size:.63rem;letter-spacing:.25em;text-transform:uppercase;color:var(--mu);padding:.75rem 1.5rem;cursor:none;position:relative;transition:color .3s;border:none;background:none}
.tab::after{content:'';position:absolute;bottom:-.5px;left:0;right:0;height:1.5px;background:var(--ac);transform:scaleX(0);transition:transform .3s}
.tab.active,.tab:hover{color:var(--ac)}.tab.active::after{transform:scaleX(1)}
.menu-panel{display:none}.menu-panel.active{display:grid;grid-template-columns:1fr 1fr;gap:0}
.menu-item{padding:2rem 0;border-bottom:.5px solid rgba(255,255,255,.05);display:flex;justify-content:space-between;align-items:start;position:relative;padding-right:2rem}
.menu-item:nth-child(odd){padding-left:0;padding-right:3rem;border-right:.5px solid rgba(255,255,255,.05)}
.menu-item:nth-child(even){padding-left:3rem;padding-right:0}
.item-info{flex:1}
.item-name{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:400;margin-bottom:.3rem;transition:color .3s}
.menu-item:hover .item-name{color:var(--ac)}
.item-desc{font-size:.7rem;color:var(--mu);letter-spacing:.04em;line-height:1.6}
.item-price{font-family:'Cormorant Garamond',serif;font-size:1.05rem;color:var(--ac);white-space:nowrap;margin-left:1.5rem}
.experience{padding:7rem 4rem;background:linear-gradient(135deg,var(--bg2) 0%,var(--bg3) 100%);position:relative;overflow:hidden}
.exp-bg-text{position:absolute;font-family:'Cormorant Garamond',serif;font-size:20vw;font-weight:300;font-style:italic;color:color-mix(in srgb,var(--ac) 4%,transparent);right:-2vw;top:50%;transform:translateY(-50%);white-space:nowrap;pointer-events:none;user-select:none}
.exp-grid{display:grid;grid-template-columns:1fr 1fr;gap:6rem;align-items:center;position:relative;z-index:1}
.exp-heading{font-family:'Cormorant Garamond',serif;font-size:clamp(2.5rem,4vw,4rem);font-weight:300;line-height:1.1;margin-bottom:2rem}
.exp-heading em{font-style:italic;color:var(--ac)}
.exp-body{font-size:.78rem;color:var(--mu);line-height:1.9;letter-spacing:.05em;margin-bottom:2.5rem}
.exp-stats{display:flex;gap:3rem;margin-bottom:2.5rem}
.stat-num{font-family:'Cormorant Garamond',serif;font-size:3rem;font-weight:300;color:var(--ac);display:block;line-height:1}
.stat-label{font-size:.58rem;letter-spacing:.25em;text-transform:uppercase;color:var(--mu);margin-top:.3rem}
.exp-cta{display:inline-flex;align-items:center;gap:1rem;font-size:.63rem;letter-spacing:.25em;text-transform:uppercase;color:var(--ac);text-decoration:none;transition:gap .3s}
.exp-cta:hover{gap:1.5rem}.exp-cta::after{content:'→';transition:transform .3s}.exp-cta:hover::after{transform:translateX(4px)}
.exp-visual{aspect-ratio:4/5;position:relative;background:var(--bg3);border:.5px solid color-mix(in srgb,var(--ac) 18%,transparent);color:var(--ac)}
.exp-visual-inner{position:absolute;inset:1.5rem;border:.5px solid color-mix(in srgb,var(--ac) 12%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem}
.exp-visual-label{font-family:'Cormorant Garamond',serif;font-size:.88rem;font-style:italic;color:var(--acD);letter-spacing:.15em}
.gold-corner{position:absolute;width:30px;height:30px;border-color:var(--acD);border-style:solid;opacity:.5}
.gc-tl{top:0;left:0;border-width:1px 0 0 1px}.gc-tr{top:0;right:0;border-width:1px 1px 0 0}
.gc-bl{bottom:0;left:0;border-width:0 0 1px 1px}.gc-br{bottom:0;right:0;border-width:0 1px 1px 0}
.tasting{padding:7rem 4rem;text-align:center;position:relative}
.tasting::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:.5px;height:80px;background:linear-gradient(to bottom,transparent,var(--acD))}
.tasting-kicker{font-size:.58rem;letter-spacing:.4em;text-transform:uppercase;color:var(--ac);margin-bottom:1.5rem}
.tasting-title{font-family:'Cormorant Garamond',serif;font-size:clamp(2rem,4vw,3.5rem);font-weight:300;margin-bottom:2.5rem}
.tasting-title em{font-style:italic;color:var(--ac)}
.tasting-courses{display:flex;justify-content:center;gap:0;margin:3rem auto;max-width:900px;flex-wrap:wrap}
.course{flex:1;padding:2rem 1.5rem;border-left:.5px solid color-mix(in srgb,var(--ac) 18%,transparent);text-align:left;min-width:130px}
.course:last-child{border-right:.5px solid color-mix(in srgb,var(--ac) 18%,transparent)}
.course-num{font-family:'Cormorant Garamond',serif;font-size:.78rem;color:var(--acD);font-style:italic;display:block;margin-bottom:.5rem}
.course-name{font-family:'Cormorant Garamond',serif;font-size:.98rem;margin-bottom:.4rem}
.course-desc{font-size:.63rem;color:var(--mu);line-height:1.7;letter-spacing:.04em}
.tasting-price{font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:var(--ac);margin-top:1rem;font-style:italic}
.tasting-cta{display:inline-block;margin-top:2rem;padding:1rem 3rem;border:.5px solid var(--ac);font-size:.63rem;letter-spacing:.25em;text-transform:uppercase;color:var(--ac);text-decoration:none;transition:background .3s,color .3s;cursor:none}
.tasting-cta:hover{background:var(--ac);color:var(--bg)}
.awards{padding:4rem;border-top:.5px solid color-mix(in srgb,var(--ac) 14%,transparent);border-bottom:.5px solid color-mix(in srgb,var(--ac) 14%,transparent);display:flex;align-items:center;gap:4rem;overflow-x:auto}
.award{display:flex;flex-direction:column;align-items:center;gap:.5rem;text-align:center;min-width:110px}
.award-icon{font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:var(--ac)}
.award-name{font-size:.58rem;letter-spacing:.2em;text-transform:uppercase;color:var(--crD)}
.award-year{font-family:'Cormorant Garamond',serif;font-size:.73rem;color:var(--mu);font-style:italic}
.awards-divider{width:.5px;height:60px;background:color-mix(in srgb,var(--ac) 16%,transparent);flex-shrink:0}
.reservation{padding:8rem 4rem;text-align:center;position:relative;overflow:hidden}
.res-bg{position:absolute;inset:0;background:radial-gradient(ellipse at center,${p.tint} 0%,transparent 70%)}
.res-kicker{font-size:.58rem;letter-spacing:.4em;text-transform:uppercase;color:var(--ac);margin-bottom:1.5rem}
.res-title{font-family:'Cormorant Garamond',serif;font-size:clamp(2.5rem,5vw,5rem);font-weight:300;margin-bottom:1rem;line-height:1}
.res-title em{font-style:italic;color:var(--ac)}
.res-sub{font-size:.76rem;color:var(--mu);letter-spacing:.08em;margin-bottom:3rem}
.res-form{display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;max-width:700px;margin:0 auto 1.5rem}
.res-form select,.res-form input{background:rgba(255,255,255,.04);border:.5px solid color-mix(in srgb,var(--ac) 35%,transparent);color:var(--cr);padding:.85rem 1.25rem;font-family:'Tenor Sans',sans-serif;font-size:.68rem;letter-spacing:.08em;min-width:150px;flex:1;outline:none;transition:border-color .3s;cursor:none}
.res-form select option{background:var(--bg3)}
.res-form select:focus,.res-form input:focus{border-color:var(--ac)}
.res-form input::placeholder{color:var(--mu)}
.res-btn{padding:.85rem 2.5rem;background:var(--ac);color:var(--bg);border:none;font-family:'Tenor Sans',sans-serif;font-size:.63rem;letter-spacing:.25em;text-transform:uppercase;cursor:none;transition:background .3s,transform .2s;flex:1;max-width:200px;min-width:150px}
.res-btn:hover{background:var(--acL);transform:scale(1.03)}
.res-note{font-size:.63rem;color:var(--mu);letter-spacing:.05em;margin-top:.5rem}
footer{padding:5rem 4rem 3rem;display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:3rem;border-top:.5px solid color-mix(in srgb,var(--ac) 18%,transparent)}
.footer-brand .logo{font-family:'Cormorant Garamond',serif;font-size:1.7rem;font-weight:300;color:var(--ac);letter-spacing:.15em;display:block;margin-bottom:1rem}
.footer-brand .logo em{font-style:italic}
.footer-brand p{font-size:.7rem;color:var(--mu);line-height:1.8;letter-spacing:.04em;max-width:260px;margin-bottom:1.5rem}
.footer-social{display:flex;gap:1rem}
.social-link{width:34px;height:34px;border:.5px solid color-mix(in srgb,var(--ac) 32%,transparent);display:flex;align-items:center;justify-content:center;color:var(--acD);text-decoration:none;font-size:.68rem;transition:border-color .3s,color .3s}
.social-link:hover{border-color:var(--ac);color:var(--ac)}
.footer-col h4{font-size:.58rem;letter-spacing:.35em;text-transform:uppercase;color:var(--ac);margin-bottom:1.5rem}
.footer-col ul{list-style:none;display:flex;flex-direction:column;gap:.75rem}
.footer-col ul li{font-size:.7rem;color:var(--mu);letter-spacing:.05em;line-height:1.5}
.footer-col ul li a{color:var(--mu);text-decoration:none;transition:color .3s}
.footer-col ul li a:hover{color:var(--ac)}
.footer-bottom{grid-column:1/-1;padding-top:2rem;border-top:.5px solid rgba(255,255,255,.05);display:flex;justify-content:space-between;align-items:center}
.footer-bottom p{font-size:.58rem;color:var(--mu);letter-spacing:.1em}
.reveal{opacity:0;transform:translateY(40px);transition:opacity .9s ease,transform .9s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--acD)}
@media(max-width:900px){
  .exp-grid,.intro{grid-template-columns:1fr}.intro-divider{display:none}
  nav{padding:1.5rem 2rem}.hero{padding:0 2rem 3rem}
  .menu-sec,.experience,.tasting,.reservation{padding:4rem 2rem}
  footer{padding:3rem 2rem 2rem;grid-template-columns:1fr 1fr}
  .awards{gap:2rem;padding:2rem}.menu-panel.active{grid-template-columns:1fr}
  .exp-visual{display:none}.exp-grid{gap:2rem}
}
@media(max-width:620px){
  .nav-links{display:none}
  footer{grid-template-columns:1fr}
  .tasting-courses{flex-direction:column}
  .course{border-left:none;border-top:.5px solid color-mix(in srgb,var(--ac) 18%,transparent);padding:1.5rem 0}
  .course:last-child{border-right:none}
}`;

/* ── SECTION HTML BUILDERS ── */

const FONT_LINK = `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Tenor+Sans&display=swap" rel="stylesheet">`;

const sCursor = () => `<div class="cursor" id="cursor"></div><div class="cursor-trail" id="cursor-trail"></div>`;

const sNav = (intake: BusinessIntake) => `
<nav id="nav">
  <a href="#" class="nav-logo">${esc(intake.businessName)}</a>
  <ul class="nav-links">
    <li><a href="#menu">Menu</a></li>
    <li><a href="#experience">Our Story</a></li>
    <li><a href="#tasting">Tasting</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
  <button class="nav-reserve" onclick="document.getElementById('reservation').scrollIntoView({behavior:'smooth'})">Reserve a Table</button>
</nav>`;

const sHero = (intake: BusinessIntake, content: GeneratedContent) => {
  const [l1, l2] = splitHeadline(content.headline);
  const yr = new Date().getFullYear() - 3;
  return `
<section class="hero" id="home">
  <div class="hero-bg"></div><div class="hero-noise"></div><div class="hero-line"></div>
  <p class="hero-eyebrow">Est. ${yr} &middot; ${esc(intake.brandTone.charAt(0).toUpperCase() + intake.brandTone.slice(1))} Cuisine &middot; ${esc(intake.city)}, ${esc(intake.country)}</p>
  <h1 class="hero-title">${esc(l1)}<br><em>${esc(l2)}</em></h1>
  <div class="hero-sub">
    <div class="hero-divider"></div>
    <p>${esc(content.subheadline.slice(0, 60))}</p>
    <div class="hero-divider"></div>
    <p>${esc(intake.city)} &middot; Fine Dining</p>
  </div>
  <div class="hero-scroll"><div class="scroll-line"></div><span>Scroll</span></div>
</section>`;
};

const sIntro = (content: GeneratedContent) => {
  const sentences = content.about.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const quote = sentences[0] ?? content.headline;
  const body = sentences.slice(1, 4).join(". ") || content.about;
  return `
<section class="intro reveal">
  <p class="intro-quote">"${esc(quote)}."</p>
  <div class="intro-divider"></div>
  <p class="intro-text">${esc(body)}</p>
</section>`;
};

const sMenu = (intake: BusinessIntake, content: GeneratedContent, sectionNum = "01") => {
  const { starters, mains, desserts } = splitMenu(content.offerings);
  const renderPanel = (items: typeof starters, id: string, active = false) =>
    items.length === 0 ? "" :
    `<div class="menu-panel${active ? " active" : ""}" id="${id}">${
      items.map(o => `<div class="menu-item"><div class="item-info"><p class="item-name">${esc(o.name)}</p><p class="item-desc">${esc(o.description)}</p></div>${o.priceHint && !/contact/i.test(o.priceHint) ? `<span class="item-price">${esc(o.priceHint)}</span>` : ""}</div>`).join("")
    }</div>`;
  const hasMains = mains.length > 0;
  const hasDesserts = desserts.length > 0;
  return `
<section class="menu-sec reveal" id="menu">
  <div class="section-header"><span class="section-tag">Today&rsquo;s Menu</span><div class="section-line"></div><span class="section-num">${sectionNum}</span></div>
  <h2 class="menu-title">The <em>Menu</em></h2>
  <p class="menu-intro">${esc(intake.description.slice(0, 90))}${intake.description.length > 90 ? "&hellip;" : ""}</p>
  <div class="menu-tabs">
    <button class="tab active" onclick="showTab('starters',this)">Starters</button>
    ${hasMains ? `<button class="tab" onclick="showTab('mains',this)">Mains</button>` : ""}
    ${hasDesserts ? `<button class="tab" onclick="showTab('desserts',this)">Desserts</button>` : ""}
  </div>
  ${renderPanel(starters, "starters", true)}
  ${renderPanel(mains, "mains")}
  ${renderPanel(desserts, "desserts")}
</section>`;
};

const sExperience = (intake: BusinessIntake, content: GeneratedContent, sectionNum = "02") => `
<section class="experience reveal" id="experience">
  <div class="exp-bg-text">${esc(intake.businessName.split(" ")[0])}</div>
  <div class="section-header"><span class="section-tag">Our Philosophy</span><div class="section-line"></div><span class="section-num">${sectionNum}</span></div>
  <div class="exp-grid">
    <div>
      <h2 class="exp-heading">A Dining <em>Experience</em><br>Without Compromise</h2>
      <p class="exp-body">${esc(content.about)}</p>
      <div class="exp-stats">
        <div><span class="stat-num">${intake.offerings.length}+</span><span class="stat-label">Signature Items</span></div>
        <div><span class="stat-num">${intake.sections.length}</span><span class="stat-label">Sections</span></div>
        <div><span class="stat-num">★★</span><span class="stat-label">Excellence</span></div>
      </div>
      <a href="#reservation" class="exp-cta">Reserve Your Table</a>
    </div>
    <div class="exp-visual">
      <div class="gold-corner gc-tl"></div><div class="gold-corner gc-tr"></div><div class="gold-corner gc-bl"></div><div class="gold-corner gc-br"></div>
      <div class="exp-visual-inner">
        <svg width="130" height="130" viewBox="0 0 140 140" fill="none"><circle cx="70" cy="70" r="60" stroke="currentColor" stroke-width="0.5" opacity="0.4"/><circle cx="70" cy="70" r="45" stroke="currentColor" stroke-width="0.5" opacity="0.3"/><ellipse cx="70" cy="80" rx="30" ry="8" stroke="currentColor" stroke-width="0.5" opacity="0.6"/><path d="M55 65 Q70 45 85 65" stroke="currentColor" stroke-width="0.5" fill="none" opacity="0.5"/><circle cx="70" cy="55" r="3" fill="currentColor" opacity="0.4"/><line x1="70" y1="10" x2="70" y2="130" stroke="currentColor" stroke-width="0.3" opacity="0.15"/><line x1="10" y1="70" x2="130" y2="70" stroke="currentColor" stroke-width="0.3" opacity="0.15"/></svg>
        <span class="exp-visual-label">${esc(intake.businessName)}</span>
      </div>
    </div>
  </div>
</section>`;

const sTasting = (intake: BusinessIntake, content: GeneratedContent) => {
  const courses = content.offerings.slice(0, 6);
  return `
<section class="tasting reveal" id="tasting">
  <p class="tasting-kicker">Signature Offering</p>
  <h2 class="tasting-title">The <em>Tasting Menu</em></h2>
  <p style="font-size:.76rem;color:var(--mu);letter-spacing:.08em;max-width:500px;margin:0 auto 1rem;">A curated journey through our kitchen. Presented evenings only.</p>
  <div class="tasting-courses">
    ${courses.map((o, i) => `<div class="course"><span class="course-num">${ROMAN[i]}</span><p class="course-name">${esc(o.name)}</p><p class="course-desc">${esc(o.description.slice(0, 55))}${o.description.length > 55 ? "&hellip;" : ""}</p></div>`).join("")}
  </div>
  <a href="#reservation" class="tasting-cta">Reserve the Tasting Menu</a>
</section>`;
};

const sAwards = () => `
<div class="awards reveal">
  <div class="award"><span class="award-icon">✦</span><span class="award-name">Fine Dining</span><span class="award-year">Excellence</span></div>
  <div class="awards-divider"></div>
  <div class="award"><span class="award-icon">★</span><span class="award-name">Culinary Award</span><span class="award-year">Recognized</span></div>
  <div class="awards-divider"></div>
  <div class="award"><span class="award-icon">№1</span><span class="award-name">City&rsquo;s Best</span><span class="award-year">Awarded</span></div>
  <div class="awards-divider"></div>
  <div class="award"><span class="award-icon">◈</span><span class="award-name">Artisan Kitchen</span><span class="award-year">Celebrated</span></div>
</div>`;

const sReservation = (intake: BusinessIntake) => `
<section class="reservation reveal" id="reservation">
  <div class="res-bg"></div>
  <p class="res-kicker">Join Us</p>
  <h2 class="res-title">Make Your <em>Reservation</em></h2>
  <p class="res-sub">Reserve your table at ${esc(intake.businessName)}. We look forward to welcoming you.</p>
  <div class="res-form">
    <input type="date" id="res-date" />
    <select><option>2 Guests</option><option>3 Guests</option><option>4 Guests</option><option>6 Guests</option></select>
    <select><option>6:00 PM</option><option>7:00 PM</option><option>7:30 PM</option><option>8:00 PM</option><option>9:00 PM</option></select>
    <input type="text" placeholder="Full Name" />
    <input type="email" placeholder="Email Address" />
    <button class="res-btn" onclick="showConfirmation()">Request Table</button>
  </div>
  <p class="res-note" id="res-confirm" style="display:none;color:var(--ac);margin-top:1rem;letter-spacing:.1em;">&#10022; Thank you &mdash; we will confirm your reservation shortly.</p>
  ${intake.phone ? `<p class="res-note">For larger groups: <strong style="color:var(--crD)">${esc(intake.phone)}</strong></p>` : ""}
</section>`;

const sFooter = (intake: BusinessIntake) => {
  const parts = intake.businessName.trim().split(" ");
  const last = parts.length > 1 ? parts.pop()! : "";
  const first = parts.join(" ");
  return `
<footer id="contact">
  <div class="footer-brand">
    <span class="logo"><em>${esc(first)}</em>${last ? " " + esc(last) : ""}</span>
    <p>${esc(intake.description.slice(0, 120))}${intake.description.length > 120 ? "&hellip;" : ""}</p>
    <div class="footer-social">
      <a href="#" class="social-link">f</a>
      <a href="#" class="social-link">ig</a>
      <a href="#" class="social-link">tw</a>
    </div>
  </div>
  <div class="footer-col">
    <h4>Location</h4>
    <ul>
      ${intake.address ? `<li>${esc(intake.address)}<br>${esc(intake.city)}, ${esc(intake.country)}</li>` : `<li>${esc(intake.city)}, ${esc(intake.country)}</li>`}
      ${intake.phone ? `<li><a href="tel:${esc(intake.phone)}">${esc(intake.phone)}</a></li>` : ""}
      <li><a href="mailto:${esc(intake.contactEmail)}">${esc(intake.contactEmail)}</a></li>
    </ul>
  </div>
  <div class="footer-col">
    <h4>Navigate</h4>
    <ul>
      <li><a href="#menu">The Menu</a></li>
      <li><a href="#experience">Our Story</a></li>
      <li><a href="#tasting">Tasting Menu</a></li>
      <li><a href="#reservation">Reservations</a></li>
    </ul>
  </div>
  <div class="footer-bottom">
    <p>&copy; ${new Date().getFullYear()} ${esc(intake.businessName)}. All rights reserved.</p>
    <p>${esc(intake.city)}, ${esc(intake.country)}</p>
  </div>
</footer>`;
};

const sScripts = () => `
<script>
const cursor=document.getElementById('cursor'),trail=document.getElementById('cursor-trail');
let mx=0,my=0,tx=0,ty=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cursor.style.left=mx+'px';cursor.style.top=my+'px';});
(function loop(){tx+=(mx-tx)*.12;ty+=(my-ty)*.12;trail.style.left=tx+'px';trail.style.top=ty+'px';requestAnimationFrame(loop);})();
window.addEventListener('scroll',()=>{document.getElementById('nav').classList.toggle('scrolled',scrollY>60);});
function showTab(n,b){document.querySelectorAll('.menu-panel').forEach(p=>p.classList.remove('active'));document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.getElementById(n).classList.add('active');b.classList.add('active');}
new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:.1}).observe.bind(null);
(()=>{const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:.1});document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));})();
function showConfirmation(){const d=document.getElementById('res-confirm');d.style.display='block';d.style.opacity='0';setTimeout(()=>{d.style.transition='opacity .5s';d.style.opacity='1';},50);}
const di=document.getElementById('res-date');if(di){const t=new Date();di.min=[t.getFullYear(),String(t.getMonth()+1).padStart(2,'0'),String(t.getDate()).padStart(2,'0')].join('-');}
</script>`;

/* ── 4 VARIANT RENDERERS ── */
// Variant 1 — Luxe Gold/Black: hero → intro → menu → experience → tasting → awards → reservation → footer
export const maisonLuxeBody = (ctx: MCtx): string => {
  const { intake, content } = ctx;
  return [FONT_LINK, sCursor(), sNav(intake), sHero(intake, content), sIntro(content), sMenu(intake, content, "01"), sExperience(intake, content, "02"), sTasting(intake, content), sAwards(), sReservation(intake), sFooter(intake), sScripts()].join("\n");
};

// Variant 2 — Azure Navy/Blue: hero → experience → intro → menu → tasting → awards → reservation → footer
export const maisonAzureBody = (ctx: MCtx): string => {
  const { intake, content } = ctx;
  return [FONT_LINK, sCursor(), sNav(intake), sHero(intake, content), sExperience(intake, content, "01"), sIntro(content), sMenu(intake, content, "02"), sTasting(intake, content), sAwards(), sReservation(intake), sFooter(intake), sScripts()].join("\n");
};

// Variant 3 — Rouge Dark/Red: hero → intro → experience → tasting → menu → awards → reservation → footer
export const maisonRougeBody = (ctx: MCtx): string => {
  const { intake, content } = ctx;
  return [FONT_LINK, sCursor(), sNav(intake), sHero(intake, content), sIntro(content), sExperience(intake, content, "01"), sTasting(intake, content), sMenu(intake, content, "02"), sAwards(), sReservation(intake), sFooter(intake), sScripts()].join("\n");
};

// Variant 4 — Verdant Dark/Green: hero → tasting → intro → experience → menu → awards → reservation → footer
export const maisonVerdantBody = (ctx: MCtx): string => {
  const { intake, content } = ctx;
  return [FONT_LINK, sCursor(), sNav(intake), sHero(intake, content), sTasting(intake, content), sIntro(content), sExperience(intake, content, "01"), sMenu(intake, content, "02"), sAwards(), sReservation(intake), sFooter(intake), sScripts()].join("\n");
};

/* ── EXPORTS ── */
export const maisonRenderers: Record<string, MaisonRenderer> = {
  "maison-luxe":    maisonLuxeBody,
  "maison-azure":   maisonAzureBody,
  "maison-rouge":   maisonRougeBody,
  "maison-verdant": maisonVerdantBody,
};

export const maisonCssMap: Record<string, string> = {
  "maison-luxe":    buildMaisonCss(PAL.luxe),
  "maison-azure":   buildMaisonCss(PAL.azure),
  "maison-rouge":   buildMaisonCss(PAL.rouge),
  "maison-verdant": buildMaisonCss(PAL.verdant),
};
