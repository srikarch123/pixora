import { randomInt } from "node:crypto";
import type { BusinessIntake, BusinessType, GeneratedContent, RenderedFile } from "../types.js";

export interface WebsiteTemplate {
  id: string;
  name: string;
  bestFor: BusinessType[];
  imageGuidance: string;
  description: string;
}

interface RenderContext {
  intake: BusinessIntake;
  content: GeneratedContent;
  template: WebsiteTemplate;
  assets: {
    heroImage: string;
    galleryImages: string[];
  };
}

type TemplateRenderer = (context: RenderContext) => string;

export const templates: WebsiteTemplate[] = [
  {
    id: "bistro-editorial",
    name: "Bistro Editorial",
    bestFor: ["restaurant"],
    imageGuidance: "Hero photo of food, drinks, seating, or the storefront. Add 2-4 gallery photos for menu highlights.",
    description: "Restaurant layout with editorial hero, menu cards, story section, and strong reservation/contact flow."
  },
  {
    id: "catalog-luxe",
    name: "Catalog Luxe",
    bestFor: ["retail", "beauty"],
    imageGuidance: "Hero product or salon image. Add clean product, treatment, or detail photos.",
    description: "Premium catalog-style layout with product tiles, visual merchandising, and direct ordering actions."
  },
  {
    id: "service-pro",
    name: "Service Pro",
    bestFor: ["services"],
    imageGuidance: "Hero image showing the service in action, the team, or a polished completed result.",
    description: "Conversion-focused service business template with proof, process, cards, and quote request flow."
  },
  {
    id: "studio-split",
    name: "Studio Split",
    bestFor: ["beauty", "portfolio", "services"],
    imageGuidance: "Portrait, studio, before-and-after, workspace, or project image with a clear subject.",
    description: "Modern split-screen template for studios, creators, beauty businesses, and personal brands."
  },
  {
    id: "neighborhood-classic",
    name: "Neighborhood Classic",
    bestFor: ["restaurant", "retail", "services"],
    imageGuidance: "Friendly storefront, owner/team image, local interior, or recognizable neighborhood detail.",
    description: "Trust-forward local business layout with warm sections, practical information, and strong contact access."
  },
  {
    id: "showcase-grid",
    name: "Showcase Grid",
    bestFor: ["portfolio", "retail", "beauty"],
    imageGuidance: "Use 3-6 strong gallery images so the grid can sell the work visually.",
    description: "Visual-first portfolio/catalog layout with large image grid, concise copy, and polished cards."
  }
];

export const selectTemplate = (businessType: BusinessType) => {
  const candidates = templates.filter((template) => template.bestFor.includes(businessType));
  return candidates[randomInt(candidates.length)] ?? templates[randomInt(templates.length)];
};

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const assetFallbacks: Record<BusinessType, string[]> = {
  restaurant: [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=82",
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
  ],
  retail: [
    "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=1600&q=82",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80"
  ],
  services: [
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=82",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80"
  ],
  beauty: [
    "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1600&q=82",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=80"
  ],
  portfolio: [
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=82",
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80"
  ]
};

const getAssets = (intake: BusinessIntake) => {
  const fallbackImages = assetFallbacks[intake.businessType];
  const galleryImages = intake.galleryImageUrls?.filter(Boolean) ?? [];

  return {
    heroImage: intake.heroImageUrl || galleryImages[0] || fallbackImages[0],
    galleryImages: [...galleryImages, ...fallbackImages].slice(0, 6)
  };
};

const offeringCards = (content: GeneratedContent, className = "card") =>
  content.offerings
    .map(
      (offering) => `<article class="${className}">
        <h3>${escapeHtml(offering.name)}</h3>
        <p>${escapeHtml(offering.description)}</p>
        ${offering.priceHint ? `<span>${escapeHtml(offering.priceHint)}</span>` : ""}
      </article>`
    )
    .join("\n");

const testimonials = (content: GeneratedContent) =>
  content.testimonials
    .map(
      (testimonial) => `<blockquote>
        <p>"${escapeHtml(testimonial.quote)}"</p>
        <footer>${escapeHtml(testimonial.author)}</footer>
      </blockquote>`
    )
    .join("\n");

const gallery = (images: string[]) =>
  images
    .slice(0, 6)
    .map((image, index) => `<img src="${escapeHtml(image)}" alt="Business gallery image ${index + 1}" loading="lazy">`)
    .join("\n");

const nav = (intake: BusinessIntake) => `<nav>
  ${intake.sections.includes("about") ? '<a href="#about">About</a>' : ""}
  ${intake.sections.some((section) => ["services", "products", "menu"].includes(section)) ? '<a href="#offerings">Offerings</a>' : ""}
  ${intake.sections.includes("gallery") ? '<a href="#gallery">Gallery</a>' : ""}
  ${intake.sections.includes("contact") ? '<a href="#contact">Contact</a>' : ""}
</nav>`;

const contact = (intake: BusinessIntake) => {
  const lines = [
    intake.address,
    intake.phone,
    intake.whatsapp ? `WhatsApp: ${intake.whatsapp}` : undefined,
    intake.contactEmail,
    intake.socialLinks
  ]
    .filter(Boolean)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("\n");

  return `<section id="contact" class="contact-band">
    <p class="eyebrow">Start here</p>
    <h2>Contact ${escapeHtml(intake.businessName)}</h2>
    <ul>${lines}</ul>
  </section>`;
};

const baseDocument = (context: RenderContext, body: string, css: string) => {
  const { intake, content, template } = context;

  const html = `<!doctype html>
<html lang="${intake.language}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(content.seoTitle)}</title>
    <meta name="description" content="${escapeHtml(content.seoDescription)}">
    <link rel="stylesheet" href="styles.css">
  </head>
  <body data-template="${template.id}" data-tone="${intake.brandTone}">
    ${body}
  </body>
</html>`;

  return {
    html,
    previewHtml: html.replace('<link rel="stylesheet" href="styles.css">', `<style>${css}</style>`)
  };
};

const cssVariables = (intake: BusinessIntake) => {
  const [primary = "#245c49", accent = "#d6a43f", paper = "#fffdf8"] = intake.colors
    .split(",")
    .map((color) => color.trim())
    .filter(Boolean);

  const tone = {
    warm: { radius: "18px", shadow: "0 18px 55px rgba(66, 42, 18, 0.13)", font: "ui-serif, Georgia, serif" },
    modern: { radius: "8px", shadow: "0 18px 50px rgba(18, 28, 35, 0.12)", font: "Inter, ui-sans-serif, system-ui, sans-serif" },
    premium: { radius: "2px", shadow: "0 26px 80px rgba(10, 15, 18, 0.18)", font: "ui-serif, Georgia, serif" },
    playful: { radius: "24px", shadow: "0 16px 45px rgba(31, 92, 73, 0.16)", font: "Inter, ui-sans-serif, system-ui, sans-serif" },
    traditional: { radius: "10px", shadow: "0 14px 40px rgba(50, 42, 31, 0.12)", font: "ui-serif, Georgia, serif" }
  }[intake.brandTone];

  return `:root {
  --primary: ${primary};
  --accent: ${accent};
  --paper: ${paper};
  --ink: #151b18;
  --muted: #65716b;
  --surface: color-mix(in srgb, var(--paper) 88%, var(--primary));
  --radius: ${tone.radius};
  --shadow: ${tone.shadow};
  --display-font: ${tone.font};
}`;
};

const sharedCss = (intake: BusinessIntake) => `${cssVariables(intake)}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  color: var(--ink);
  background: var(--paper);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.55;
}
img { display: block; width: 100%; height: 100%; object-fit: cover; }
a { color: inherit; }
h1, h2, h3, p { margin-top: 0; }
h1, h2 { font-family: var(--display-font); letter-spacing: 0; }
h1 { font-size: clamp(3rem, 8vw, 7.4rem); line-height: 0.9; max-width: 11ch; }
h2 { font-size: clamp(2rem, 4vw, 4.4rem); line-height: 0.95; }
h3 { font-size: 1.08rem; }
.eyebrow {
  margin-bottom: 12px;
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 18px clamp(20px, 5vw, 72px);
  background: color-mix(in srgb, var(--paper) 88%, transparent);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(21, 27, 24, 0.1);
}
.brand { font-weight: 900; text-decoration: none; }
nav { display: flex; gap: 18px; color: var(--muted); font-size: 0.92rem; font-weight: 750; }
nav a { text-decoration: none; }
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 20px;
  border-radius: min(var(--radius), 12px);
  color: white;
  background: var(--primary);
  text-decoration: none;
  font-weight: 900;
}
.section { padding: clamp(54px, 8vw, 108px) clamp(20px, 5vw, 72px); }
.muted { color: var(--muted); }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 18px; }
.card, blockquote {
  margin: 0;
  padding: 24px;
  border: 1px solid rgba(21, 27, 24, 0.11);
  border-radius: var(--radius);
  background: white;
  box-shadow: 0 1px 0 rgba(21, 27, 24, 0.04);
}
.card span { color: var(--primary); font-weight: 850; }
.contact-band {
  padding: clamp(46px, 7vw, 86px) clamp(20px, 5vw, 72px);
  color: white;
  background: var(--primary);
}
.contact-band .eyebrow { color: color-mix(in srgb, var(--accent) 82%, white); }
.contact-band ul { display: grid; gap: 8px; padding: 0; margin: 0; list-style: none; color: rgba(255,255,255,0.84); }
@media (max-width: 760px) {
  .site-header { align-items: flex-start; flex-direction: column; }
  nav { flex-wrap: wrap; }
}`;

const bistroEditorial: TemplateRenderer = ({ intake, content, assets }) => `<header class="site-header">
  <a class="brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
</header>
<main>
  <section class="bistro-hero">
    <div class="hero-copy">
      <p class="eyebrow">${escapeHtml(intake.city)} dining</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
    </div>
    <div class="hero-photo"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
  </section>
  <section id="about" class="section intro"><h2>${escapeHtml(intake.businessName)}</h2><p>${escapeHtml(content.about)}</p></section>
  <section id="offerings" class="section menu-wall"><p class="eyebrow">Menu highlights</p><div class="cards">${offeringCards(content)}</div></section>
  <section id="gallery" class="gallery-strip">${gallery(assets.galleryImages.slice(0, 4))}</section>
  <section class="section"><div class="cards">${testimonials(content)}</div></section>
  ${contact(intake)}
</main>`;

const catalogLuxe: TemplateRenderer = ({ intake, content, assets }) => `<header class="site-header">
  <a class="brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
</header>
<main>
  <section class="catalog-hero" style="background-image: linear-gradient(90deg, rgba(10,12,11,.72), rgba(10,12,11,.18)), url('${escapeHtml(assets.heroImage)}')">
    <div>
      <p class="eyebrow">${escapeHtml(intake.brandTone)} collection</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button" href="#offerings">${escapeHtml(content.callToAction)}</a>
    </div>
  </section>
  <section id="offerings" class="section product-board"><p class="eyebrow">Featured</p><h2>Selected for ${escapeHtml(intake.audience)}</h2><div class="cards">${offeringCards(content, "product-card")}</div></section>
  <section id="gallery" class="masonry">${gallery(assets.galleryImages)}</section>
  <section id="about" class="section narrow"><p>${escapeHtml(content.about)}</p></section>
  ${contact(intake)}
</main>`;

const servicePro: TemplateRenderer = ({ intake, content, assets }) => `<header class="site-header">
  <a class="brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
</header>
<main>
  <section class="service-hero">
    <div>
      <p class="eyebrow">${escapeHtml(intake.city)}, ${escapeHtml(intake.country)}</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
    </div>
    <aside>
      <img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}">
      <strong>Fast, clear, local service</strong>
    </aside>
  </section>
  <section id="offerings" class="section"><p class="eyebrow">Services</p><div class="cards numbered">${offeringCards(content)}</div></section>
  <section id="about" class="proof-band"><h2>Built for trust</h2><p>${escapeHtml(content.about)}</p></section>
  <section class="section"><div class="cards">${testimonials(content)}</div></section>
  ${contact(intake)}
</main>`;

const studioSplit: TemplateRenderer = ({ intake, content, assets }) => `<main class="studio">
  <section class="studio-media"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></section>
  <section class="studio-copy">
    <header><a class="brand" href="#">${escapeHtml(intake.businessName)}</a>${nav(intake)}</header>
    <p class="eyebrow">${escapeHtml(intake.brandTone)} studio</p>
    <h1>${escapeHtml(content.headline)}</h1>
    <p>${escapeHtml(content.subheadline)}</p>
    <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
  </section>
  <section id="about" class="section"><h2>About</h2><p>${escapeHtml(content.about)}</p></section>
  <section id="offerings" class="section"><div class="cards">${offeringCards(content)}</div></section>
  ${contact(intake)}
</main>`;

const neighborhoodClassic: TemplateRenderer = ({ intake, content, assets }) => `<header class="site-header">
  <a class="brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
</header>
<main>
  <section class="classic-hero">
    <div class="stamp">${escapeHtml(intake.city)}</div>
    <div>
      <p class="eyebrow">Local and independent</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
    </div>
  </section>
  <section class="classic-photo"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></section>
  <section id="about" class="section two-col"><h2>${escapeHtml(intake.businessName)}</h2><p>${escapeHtml(content.about)}</p></section>
  <section id="offerings" class="section"><div class="cards">${offeringCards(content)}</div></section>
  <section class="section"><div class="cards">${testimonials(content)}</div></section>
  ${contact(intake)}
</main>`;

const showcaseGrid: TemplateRenderer = ({ intake, content, assets }) => `<header class="site-header">
  <a class="brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
</header>
<main>
  <section class="showcase-hero">
    <div>
      <p class="eyebrow">Showcase</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
    </div>
    <div class="showcase-grid">${gallery(assets.galleryImages)}</div>
  </section>
  <section id="about" class="section narrow"><h2>${escapeHtml(intake.businessName)}</h2><p>${escapeHtml(content.about)}</p><a class="button" href="#contact">${escapeHtml(content.callToAction)}</a></section>
  <section id="offerings" class="section"><div class="cards">${offeringCards(content)}</div></section>
  ${contact(intake)}
</main>`;

const renderers: Record<string, TemplateRenderer> = {
  "bistro-editorial": bistroEditorial,
  "catalog-luxe": catalogLuxe,
  "service-pro": servicePro,
  "studio-split": studioSplit,
  "neighborhood-classic": neighborhoodClassic,
  "showcase-grid": showcaseGrid
};

const templateCss: Record<string, string> = {
  "bistro-editorial": `.bistro-hero { display: grid; grid-template-columns: 1.05fr .95fr; min-height: 76vh; }
.hero-copy { display: grid; align-content: center; padding: clamp(48px, 7vw, 96px); }
.hero-copy p { max-width: 620px; color: var(--muted); font-size: 1.1rem; }
.hero-photo { min-height: 480px; border-left: 1px solid rgba(21,27,24,.1); }
.intro { display: grid; grid-template-columns: .8fr 1.2fr; gap: 36px; }
.intro p { color: var(--muted); font-size: 1.2rem; }
.menu-wall { background: var(--surface); }
.gallery-strip { display: grid; grid-template-columns: 1.2fr .8fr .8fr 1fr; gap: 10px; padding: 10px; background: var(--primary); }
.gallery-strip img { min-height: 260px; border-radius: var(--radius); }`,
  "catalog-luxe": `.catalog-hero { min-height: 82vh; display: grid; align-items: end; padding: clamp(48px, 8vw, 112px); color: white; background-size: cover; background-position: center; }
.catalog-hero p { max-width: 620px; color: rgba(255,255,255,.82); font-size: 1.1rem; }
.product-board { background: white; }
.product-card { min-height: 220px; display: grid; align-content: space-between; padding: 28px; border-radius: var(--radius); background: var(--surface); }
.masonry { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; padding: 10px; background: #111614; }
.masonry img { grid-column: span 2; min-height: 260px; border-radius: var(--radius); }
.masonry img:first-child { grid-column: span 3; min-height: 390px; }
.narrow { max-width: 900px; margin: 0 auto; font-size: 1.22rem; color: var(--muted); }`,
  "service-pro": `.service-hero { display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 32px; align-items: center; min-height: 76vh; padding: clamp(46px, 7vw, 96px); background: var(--surface); }
.service-hero p { max-width: 650px; color: var(--muted); font-size: 1.1rem; }
.service-hero aside { overflow: hidden; border-radius: var(--radius); background: white; box-shadow: var(--shadow); }
.service-hero aside img { height: 420px; }
.service-hero aside strong { display: block; padding: 18px 20px; }
.numbered { counter-reset: service; }
.numbered .card { position: relative; padding-top: 58px; }
.numbered .card::before { counter-increment: service; content: counter(service, decimal-leading-zero); position: absolute; top: 18px; left: 22px; color: var(--primary); font-weight: 950; }
.proof-band { display: grid; grid-template-columns: .8fr 1.2fr; gap: 36px; padding: clamp(52px, 8vw, 104px) clamp(20px, 5vw, 72px); color: white; background: #111614; }
.proof-band p { color: rgba(255,255,255,.78); font-size: 1.12rem; }`,
  "studio-split": `.studio { display: grid; grid-template-columns: 48vw minmax(0, 1fr); }
.studio-media { position: sticky; top: 0; height: 100vh; }
.studio-copy { display: grid; align-content: center; min-height: 100vh; padding: clamp(42px, 7vw, 88px); background: var(--paper); }
.studio-copy header { position: absolute; top: 22px; right: 28px; left: calc(48vw + 28px); display: flex; justify-content: space-between; gap: 20px; }
.studio-copy p { color: var(--muted); font-size: 1.1rem; }
.studio .section { grid-column: 1 / -1; background: white; }`,
  "neighborhood-classic": `.classic-hero { position: relative; min-height: 64vh; display: grid; align-items: center; padding: clamp(50px, 8vw, 104px); background: var(--surface); overflow: hidden; }
.classic-hero p { max-width: 640px; color: var(--muted); font-size: 1.1rem; }
.stamp { position: absolute; right: clamp(24px, 7vw, 90px); top: 54px; width: 128px; height: 128px; display: grid; place-items: center; border: 2px solid var(--primary); border-radius: 999px; color: var(--primary); font-family: var(--display-font); font-size: 1.2rem; transform: rotate(8deg); }
.classic-photo { height: 46vh; margin: 0 clamp(20px, 5vw, 72px); overflow: hidden; border-radius: var(--radius); box-shadow: var(--shadow); }
.two-col { display: grid; grid-template-columns: .8fr 1.2fr; gap: 36px; }
.two-col p { color: var(--muted); font-size: 1.14rem; }`,
  "showcase-grid": `.showcase-hero { display: grid; grid-template-columns: .78fr 1.22fr; gap: 28px; align-items: center; min-height: 76vh; padding: clamp(36px, 6vw, 72px); }
.showcase-hero p { color: var(--muted); font-size: 1.1rem; }
.showcase-grid { display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 170px; gap: 10px; }
.showcase-grid img { border-radius: var(--radius); box-shadow: var(--shadow); }
.showcase-grid img:first-child { grid-row: span 2; }
.showcase-grid img:nth-child(4) { grid-column: span 2; }
.narrow { max-width: 920px; margin: 0 auto; color: var(--muted); font-size: 1.15rem; }`
};

const responsiveCss = `@media (max-width: 900px) {
  .bistro-hero, .intro, .service-hero, .proof-band, .studio, .two-col, .showcase-hero { grid-template-columns: 1fr; }
  .studio-media { position: relative; height: 58vh; }
  .studio-copy header { position: static; margin-bottom: 44px; flex-direction: column; }
  .masonry, .gallery-strip, .showcase-grid { grid-template-columns: 1fr 1fr; }
  .masonry img, .masonry img:first-child { grid-column: auto; min-height: 230px; }
}
@media (max-width: 620px) {
  .masonry, .gallery-strip, .showcase-grid { grid-template-columns: 1fr; }
  h1 { font-size: clamp(2.55rem, 16vw, 4.8rem); }
}`;

export const renderWebsite = (
  intake: BusinessIntake,
  content: GeneratedContent,
  templateId: string
): { previewHtml: string; files: RenderedFile[] } => {
  const template = templates.find((item) => item.id === templateId) ?? selectTemplate(intake.businessType);
  const context: RenderContext = {
    intake,
    content,
    template,
    assets: getAssets(intake)
  };
  const renderer = renderers[template.id] ?? neighborhoodClassic;
  const css = `${sharedCss(intake)}\n${templateCss[template.id]}\n${responsiveCss}`;
  const { html, previewHtml } = baseDocument(context, renderer(context), css);

  return {
    previewHtml,
    files: [
      { path: "index.html", language: "html", content: html },
      { path: "styles.css", language: "css", content: css },
      {
        path: "pixora-site.json",
        language: "json",
        content: JSON.stringify({ intake, generatedContent: content, templateId: template.id }, null, 2)
      }
    ]
  };
};
