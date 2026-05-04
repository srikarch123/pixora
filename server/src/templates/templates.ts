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
  },
  {
    id: "landing-impact",
    name: "Landing Impact",
    bestFor: ["services", "restaurant", "retail", "beauty", "portfolio"],
    imageGuidance: "Strong full-bleed hero photo — storefront, team, product, or environment.",
    description: "Bold conversion landing page with full-bleed hero, two-column story, feature grid, and gallery strip."
  },
  {
    id: "minimal-type",
    name: "Minimal Type",
    bestFor: ["portfolio", "services"],
    imageGuidance: "4 clean gallery photos that showcase your work or space — quality over quantity.",
    description: "Typography-first minimalist layout with large display text, offering list, and restrained decoration."
  },
  {
    id: "dark-luxury",
    name: "Dark Luxury",
    bestFor: ["beauty", "restaurant", "retail"],
    imageGuidance: "Moody, dramatic hero and gallery photos. Low-key lighting and rich textures work best.",
    description: "Dark-background premium layout with elegant serif type, gold accents, and an editorial feel."
  },
  {
    id: "mosaic-visual",
    name: "Mosaic Visual",
    bestFor: ["retail", "beauty", "portfolio"],
    imageGuidance: "4–5 strong photos — the mosaic is the first thing visitors see, so they need to be compelling.",
    description: "Asymmetric image mosaic hero that leads visually, followed by clean copy and offering sections."
  },
  {
    id: "bold-magazine",
    name: "Bold Magazine",
    bestFor: ["restaurant", "retail", "services"],
    imageGuidance: "One hero and 2-3 editorial-quality detail shots with strong composition.",
    description: "Oversized editorial headlines, accent-color sections, and numbered feature cards."
  },
  {
    id: "wellness-light",
    name: "Wellness Light",
    bestFor: ["beauty", "services"],
    imageGuidance: "Bright, airy, soft-lit photos — natural light, clean environments, or calm details.",
    description: "Soft and spacious wellness layout with rounded shapes, gentle gradients, and serene whitespace."
  }
];

export const selectTemplate = (businessType: BusinessType) => {
  const candidates = templates.filter((t) => t.bestFor.includes(businessType));
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
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80"
  ],
  retail: [
    "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=1600&q=82",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
  ],
  services: [
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=82",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
  ],
  beauty: [
    "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1600&q=82",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80"
  ],
  portfolio: [
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=82",
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1200&q=80"
  ]
};

const getAssets = (intake: BusinessIntake) => {
  const fallbacks = assetFallbacks[intake.businessType];
  const gallery = intake.galleryImageUrls?.filter(Boolean) ?? [];
  return {
    heroImage: intake.heroImageUrl || gallery[0] || fallbacks[0],
    galleryImages: [...gallery, ...fallbacks].slice(0, 6)
  };
};

const offeringCards = (content: GeneratedContent, className = "card") =>
  content.offerings
    .map(
      (o) => `<article class="${className}">
        <h3>${escapeHtml(o.name)}</h3>
        <p>${escapeHtml(o.description)}</p>
        ${o.priceHint ? `<span>${escapeHtml(o.priceHint)}</span>` : ""}
      </article>`
    )
    .join("\n");

const testimonialBlock = (content: GeneratedContent) =>
  content.testimonials
    .map(
      (t) => `<blockquote>
        <p>"${escapeHtml(t.quote)}"</p>
        <footer>${escapeHtml(t.author)}</footer>
      </blockquote>`
    )
    .join("\n");

const galleryHtml = (images: string[]) =>
  images
    .slice(0, 6)
    .map((img, i) => `<img src="${escapeHtml(img)}" alt="Gallery image ${i + 1}" loading="lazy">`)
    .join("\n");

const nav = (intake: BusinessIntake) => `<nav>
  ${intake.sections.includes("about") ? '<a href="#about">About</a>' : ""}
  ${intake.sections.some((s) => ["services", "products", "menu"].includes(s)) ? '<a href="#offerings">Offerings</a>' : ""}
  ${intake.sections.includes("gallery") ? '<a href="#gallery">Gallery</a>' : ""}
  ${intake.sections.includes("contact") ? '<a href="#contact">Contact</a>' : ""}
</nav>`;

const contactSection = (intake: BusinessIntake) => {
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
    <p class="eyebrow">Get in touch</p>
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
    .map((c) => c.trim())
    .filter(Boolean);
  const tone = {
    warm: { radius: "18px", shadow: "0 18px 55px rgba(66,42,18,.13)", font: "ui-serif, Georgia, serif" },
    modern: { radius: "8px", shadow: "0 18px 50px rgba(18,28,35,.12)", font: "Inter, ui-sans-serif, system-ui, sans-serif" },
    premium: { radius: "2px", shadow: "0 26px 80px rgba(10,15,18,.18)", font: "ui-serif, Georgia, serif" },
    playful: { radius: "24px", shadow: "0 16px 45px rgba(31,92,73,.16)", font: "Inter, ui-sans-serif, system-ui, sans-serif" },
    traditional: { radius: "10px", shadow: "0 14px 40px rgba(50,42,31,.12)", font: "ui-serif, Georgia, serif" }
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
body { margin: 0; color: var(--ink); background: var(--paper); font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; line-height: 1.55; }
img { display: block; width: 100%; height: 100%; object-fit: cover; }
a { color: inherit; }
h1, h2, h3, p { margin-top: 0; }
h1, h2 { font-family: var(--display-font); letter-spacing: 0; }
h1 { font-size: clamp(3rem, 8vw, 7.4rem); line-height: 0.9; max-width: 11ch; }
h2 { font-size: clamp(2rem, 4vw, 4.4rem); line-height: 0.95; }
h3 { font-size: 1.08rem; }
.eyebrow { margin-bottom: 12px; color: var(--primary); font-size: 0.78rem; font-weight: 850; letter-spacing: 0; text-transform: uppercase; }
.site-header { position: sticky; top: 0; z-index: 10; display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 18px clamp(20px,5vw,72px); background: color-mix(in srgb, var(--paper) 88%, transparent); backdrop-filter: blur(18px); border-bottom: 1px solid rgba(21,27,24,.1); }
.brand { font-weight: 900; text-decoration: none; }
nav { display: flex; gap: 18px; color: var(--muted); font-size: 0.92rem; font-weight: 750; }
nav a { text-decoration: none; }
.button { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 22px; border-radius: min(var(--radius), 12px); color: white; background: var(--primary); text-decoration: none; font-weight: 900; }
.section { padding: clamp(54px,8vw,108px) clamp(20px,5vw,72px); }
.muted { color: var(--muted); }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 18px; }
.card, blockquote { margin: 0; padding: 24px; border: 1px solid rgba(21,27,24,.11); border-radius: var(--radius); background: white; box-shadow: 0 1px 0 rgba(21,27,24,.04); }
.card span { color: var(--primary); font-weight: 850; }
blockquote footer { margin-top: 12px; color: var(--muted); font-size: 0.88rem; }
.contact-band { padding: clamp(46px,7vw,86px) clamp(20px,5vw,72px); color: white; background: var(--primary); }
.contact-band .eyebrow { color: color-mix(in srgb, var(--accent) 82%, white); }
.contact-band ul { display: grid; gap: 8px; padding: 0; margin: 0; list-style: none; color: rgba(255,255,255,.84); }
@media (max-width: 760px) { .site-header { align-items: flex-start; flex-direction: column; } nav { flex-wrap: wrap; } }`;

/* ═══════════════════════════════════════════════════════════════
   ORIGINAL 6 TEMPLATES
═══════════════════════════════════════════════════════════════ */

const bistroEditorial: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header"><a class="brand" href="#">${escapeHtml(intake.businessName)}</a>${nav(intake)}</header>
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
  <section id="gallery" class="gallery-strip">${galleryHtml(assets.galleryImages.slice(0, 4))}</section>
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const catalogLuxe: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header"><a class="brand" href="#">${escapeHtml(intake.businessName)}</a>${nav(intake)}</header>
<main>
  <section class="catalog-hero" style="background-image:linear-gradient(90deg,rgba(10,12,11,.72),rgba(10,12,11,.18)),url('${escapeHtml(assets.heroImage)}')">
    <div>
      <p class="eyebrow">${escapeHtml(intake.brandTone)} collection</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button" href="#offerings">${escapeHtml(content.callToAction)}</a>
    </div>
  </section>
  <section id="offerings" class="section product-board"><p class="eyebrow">Featured</p><h2>Selected for ${escapeHtml(intake.audience)}</h2><div class="cards">${offeringCards(content, "product-card")}</div></section>
  <section id="gallery" class="masonry">${galleryHtml(assets.galleryImages)}</section>
  <section id="about" class="section narrow"><p>${escapeHtml(content.about)}</p></section>
  ${contactSection(intake)}
</main>`;

const servicePro: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header"><a class="brand" href="#">${escapeHtml(intake.businessName)}</a>${nav(intake)}</header>
<main>
  <section class="service-hero">
    <div>
      <p class="eyebrow">${escapeHtml(intake.city)}, ${escapeHtml(intake.country)}</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
    </div>
    <aside><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"><strong>Fast, clear, local service</strong></aside>
  </section>
  <section id="offerings" class="section"><p class="eyebrow">Services</p><div class="cards numbered">${offeringCards(content)}</div></section>
  <section id="about" class="proof-band"><h2>Built for trust</h2><p>${escapeHtml(content.about)}</p></section>
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const studioSplit: TemplateRenderer = ({ intake, content, assets }) => `
<main class="studio">
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
  ${contactSection(intake)}
</main>`;

const neighborhoodClassic: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header"><a class="brand" href="#">${escapeHtml(intake.businessName)}</a>${nav(intake)}</header>
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
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const showcaseGrid: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header"><a class="brand" href="#">${escapeHtml(intake.businessName)}</a>${nav(intake)}</header>
<main>
  <section class="showcase-hero">
    <div>
      <p class="eyebrow">Showcase</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
    </div>
    <div class="showcase-grid">${galleryHtml(assets.galleryImages)}</div>
  </section>
  <section id="about" class="section narrow"><h2>${escapeHtml(intake.businessName)}</h2><p>${escapeHtml(content.about)}</p><a class="button" href="#contact">${escapeHtml(content.callToAction)}</a></section>
  <section id="offerings" class="section"><div class="cards">${offeringCards(content)}</div></section>
  ${contactSection(intake)}
</main>`;

/* ═══════════════════════════════════════════════════════════════
   NEW TEMPLATES
═══════════════════════════════════════════════════════════════ */

const landingImpact: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header"><a class="brand" href="#">${escapeHtml(intake.businessName)}</a>${nav(intake)}<a class="button" href="#contact">${escapeHtml(content.callToAction)}</a></header>
<main>
  <section class="li-hero" style="background-image:url('${escapeHtml(assets.heroImage)}')">
    <div class="li-overlay">
      <p class="eyebrow li-eyebrow">${escapeHtml(intake.city)}, ${escapeHtml(intake.country)}</p>
      <h1 class="li-h1">${escapeHtml(content.headline)}</h1>
      <p class="li-sub">${escapeHtml(content.subheadline)}</p>
      <a class="button" href="#offerings" style="margin-top:28px">${escapeHtml(content.callToAction)}</a>
    </div>
  </section>
  <section id="about" class="section li-about">
    <h2>${escapeHtml(intake.businessName)}</h2>
    <p>${escapeHtml(content.about)}</p>
  </section>
  <section id="offerings" class="section li-features"><p class="eyebrow">What we offer</p><h2>For ${escapeHtml(intake.audience)}</h2><div class="cards" style="margin-top:28px">${offeringCards(content)}</div></section>
  <section id="gallery" class="li-gallery">${galleryHtml(assets.galleryImages.slice(0, 3))}</section>
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const minimalType: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header mt-header"><a class="brand" href="#">${escapeHtml(intake.businessName)}</a>${nav(intake)}</header>
<main>
  <section class="mt-hero">
    <p class="eyebrow">${escapeHtml(intake.city)} · ${escapeHtml(intake.businessType)}</p>
    <h1>${escapeHtml(content.headline)}</h1>
    <div class="mt-rule"></div>
    <p class="mt-sub">${escapeHtml(content.subheadline)}</p>
    <a class="button" href="#offerings">${escapeHtml(content.callToAction)}</a>
  </section>
  <section id="about" class="section mt-about"><p class="eyebrow">About</p><p>${escapeHtml(content.about)}</p></section>
  <section id="gallery" class="mt-gallery">${galleryHtml(assets.galleryImages.slice(0, 4))}</section>
  <section id="offerings" class="section mt-offerings">
    <p class="eyebrow">Offerings</p>
    <div class="mt-list">
      ${content.offerings.map((o) => `<div class="mt-item"><div><h3>${escapeHtml(o.name)}</h3><p>${escapeHtml(o.description)}</p></div>${o.priceHint ? `<span>${escapeHtml(o.priceHint)}</span>` : ""}</div>`).join("")}
    </div>
  </section>
  ${contactSection(intake)}
</main>`;

const darkLuxury: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header dl-header"><a class="brand dl-brand" href="#">${escapeHtml(intake.businessName)}</a>${nav(intake)}<a class="dl-cta" href="#contact">${escapeHtml(content.callToAction)}</a></header>
<main class="dl-main">
  <section class="dl-hero">
    <div class="dl-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
    <div class="dl-hero-copy">
      <p class="eyebrow" style="color:var(--accent)">${escapeHtml(intake.city)}</p>
      <h1 class="dl-h1">${escapeHtml(content.headline)}</h1>
      <p class="dl-sub">${escapeHtml(content.subheadline)}</p>
      <a class="dl-cta" href="#contact">${escapeHtml(content.callToAction)}</a>
    </div>
  </section>
  <section id="about" class="section dl-about"><p class="eyebrow" style="color:var(--accent)">Our story</p><p class="dl-body">${escapeHtml(content.about)}</p></section>
  <section id="gallery" class="dl-gallery">${galleryHtml(assets.galleryImages)}</section>
  <section id="offerings" class="section dl-offerings"><p class="eyebrow" style="color:var(--accent)">Offerings</p><div class="dl-cards">${offeringCards(content, "dl-card")}</div></section>
  <section class="section dl-about"><div class="dl-testimonials">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const mosaicVisual: TemplateRenderer = ({ intake, content, assets }) => {
  const imgs = assets.galleryImages.slice(0, 5);
  const imgEls = imgs
    .map((src, i) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(intake.businessName)} ${i + 1}" class="mv-img mv-img-${i}">`)
    .join("");
  return `
<header class="site-header"><a class="brand" href="#">${escapeHtml(intake.businessName)}</a>${nav(intake)}</header>
<main>
  <section class="mv-opening">
    <div class="mv-mosaic">${imgEls}</div>
    <div class="mv-copy">
      <p class="eyebrow">${escapeHtml(intake.city)}, ${escapeHtml(intake.country)}</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
    </div>
  </section>
  <section id="about" class="section mv-about">
    <div><p class="eyebrow">About</p><h2>${escapeHtml(intake.businessName)}</h2></div>
    <p>${escapeHtml(content.about)}</p>
  </section>
  <section id="offerings" class="section" style="background:var(--surface)"><p class="eyebrow">Featured</p><div class="cards">${offeringCards(content)}</div></section>
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;
};

const boldMagazine: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header"><a class="brand" href="#">${escapeHtml(intake.businessName)}</a>${nav(intake)}</header>
<main>
  <section class="bm-hero">
    <div class="bm-left">
      <p class="eyebrow">${escapeHtml(intake.city)}</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
    </div>
    <div class="bm-right">
      <img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}">
    </div>
  </section>
  <section class="bm-marquee"><span>${escapeHtml(intake.businessName)}</span><span aria-hidden="true">·</span><span>${escapeHtml(intake.city)}</span><span aria-hidden="true">·</span><span>${escapeHtml(intake.brandTone)}</span><span aria-hidden="true">·</span><span>${escapeHtml(intake.businessType)}</span></section>
  <section id="about" class="section bm-about">
    <p class="eyebrow">About</p>
    <p>${escapeHtml(content.about)}</p>
  </section>
  <section id="offerings" class="section bm-grid">
    ${content.offerings.map((o, i) => `<div class="bm-feature"><span class="bm-num">0${i + 1}</span><h3>${escapeHtml(o.name)}</h3><p>${escapeHtml(o.description)}</p></div>`).join("")}
  </section>
  <section id="gallery" class="bm-gallery">${galleryHtml(assets.galleryImages.slice(0, 4))}</section>
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const wellnessLight: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header wl-header"><a class="brand" href="#">${escapeHtml(intake.businessName)}</a>${nav(intake)}<a class="button wl-btn" href="#contact">${escapeHtml(content.callToAction)}</a></header>
<main class="wl-main">
  <section class="wl-hero">
    <div class="wl-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
    <div class="wl-hero-copy">
      <p class="eyebrow">${escapeHtml(intake.city)}</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button wl-btn" href="#offerings">${escapeHtml(content.callToAction)}</a>
    </div>
  </section>
  <section id="about" class="section wl-about">
    <p>${escapeHtml(content.about)}</p>
  </section>
  <section id="offerings" class="section wl-treatments"><p class="eyebrow">Services</p><h2>Designed for ${escapeHtml(intake.audience)}</h2><div class="wl-cards">${offeringCards(content, "wl-card")}</div></section>
  <section id="gallery" class="wl-gallery">${galleryHtml(assets.galleryImages.slice(0, 4))}</section>
  <section class="section wl-quotes"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

/* ═══════════════════════════════════════════════════════════════
   RENDERER MAP
═══════════════════════════════════════════════════════════════ */
const renderers: Record<string, TemplateRenderer> = {
  "bistro-editorial": bistroEditorial,
  "catalog-luxe": catalogLuxe,
  "service-pro": servicePro,
  "studio-split": studioSplit,
  "neighborhood-classic": neighborhoodClassic,
  "showcase-grid": showcaseGrid,
  "landing-impact": landingImpact,
  "minimal-type": minimalType,
  "dark-luxury": darkLuxury,
  "mosaic-visual": mosaicVisual,
  "bold-magazine": boldMagazine,
  "wellness-light": wellnessLight
};

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE-SPECIFIC CSS
═══════════════════════════════════════════════════════════════ */
const templateCss: Record<string, string> = {
  "bistro-editorial": `.bistro-hero{display:grid;grid-template-columns:1.05fr .95fr;min-height:76vh}
.hero-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px)}
.hero-copy p{max-width:620px;color:var(--muted);font-size:1.1rem}
.hero-photo{min-height:480px;border-left:1px solid rgba(21,27,24,.1)}
.intro{display:grid;grid-template-columns:.8fr 1.2fr;gap:36px}
.intro p{color:var(--muted);font-size:1.2rem}
.menu-wall{background:var(--surface)}
.gallery-strip{display:grid;grid-template-columns:1.2fr .8fr .8fr 1fr;gap:10px;padding:10px;background:var(--primary)}
.gallery-strip img{min-height:260px;border-radius:var(--radius)}`,

  "catalog-luxe": `.catalog-hero{min-height:82vh;display:grid;align-items:end;padding:clamp(48px,8vw,112px);color:white;background-size:cover;background-position:center}
.catalog-hero p{max-width:620px;color:rgba(255,255,255,.82);font-size:1.1rem}
.product-board{background:white}
.product-card{min-height:220px;display:grid;align-content:space-between;padding:28px;border-radius:var(--radius);background:var(--surface)}
.masonry{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;padding:10px;background:#111614}
.masonry img{grid-column:span 2;min-height:260px;border-radius:var(--radius)}
.masonry img:first-child{grid-column:span 3;min-height:390px}
.narrow{max-width:900px;margin:0 auto;font-size:1.22rem;color:var(--muted)}`,

  "service-pro": `.service-hero{display:grid;grid-template-columns:minmax(0,1fr) 420px;gap:32px;align-items:center;min-height:76vh;padding:clamp(46px,7vw,96px);background:var(--surface)}
.service-hero p{max-width:650px;color:var(--muted);font-size:1.1rem}
.service-hero aside{overflow:hidden;border-radius:var(--radius);background:white;box-shadow:var(--shadow)}
.service-hero aside img{height:420px}
.service-hero aside strong{display:block;padding:18px 20px}
.numbered{counter-reset:service}
.numbered .card{position:relative;padding-top:58px}
.numbered .card::before{counter-increment:service;content:counter(service,decimal-leading-zero);position:absolute;top:18px;left:22px;color:var(--primary);font-weight:950}
.proof-band{display:grid;grid-template-columns:.8fr 1.2fr;gap:36px;padding:clamp(52px,8vw,104px) clamp(20px,5vw,72px);color:white;background:#111614}
.proof-band p{color:rgba(255,255,255,.78);font-size:1.12rem}`,

  "studio-split": `.studio{display:grid;grid-template-columns:48vw minmax(0,1fr)}
.studio-media{position:sticky;top:0;height:100vh}
.studio-copy{display:grid;align-content:center;min-height:100vh;padding:clamp(42px,7vw,88px);background:var(--paper)}
.studio-copy header{position:absolute;top:22px;right:28px;left:calc(48vw + 28px);display:flex;justify-content:space-between;gap:20px}
.studio-copy p{color:var(--muted);font-size:1.1rem}
.studio .section{grid-column:1/-1;background:white}`,

  "neighborhood-classic": `.classic-hero{position:relative;min-height:64vh;display:grid;align-items:center;padding:clamp(50px,8vw,104px);background:var(--surface);overflow:hidden}
.classic-hero p{max-width:640px;color:var(--muted);font-size:1.1rem}
.stamp{position:absolute;right:clamp(24px,7vw,90px);top:54px;width:128px;height:128px;display:grid;place-items:center;border:2px solid var(--primary);border-radius:999px;color:var(--primary);font-family:var(--display-font);font-size:1.2rem;transform:rotate(8deg)}
.classic-photo{height:46vh;margin:0 clamp(20px,5vw,72px);overflow:hidden;border-radius:var(--radius);box-shadow:var(--shadow)}
.two-col{display:grid;grid-template-columns:.8fr 1.2fr;gap:36px}
.two-col p{color:var(--muted);font-size:1.14rem}`,

  "showcase-grid": `.showcase-hero{display:grid;grid-template-columns:.78fr 1.22fr;gap:28px;align-items:center;min-height:76vh;padding:clamp(36px,6vw,72px)}
.showcase-hero p{color:var(--muted);font-size:1.1rem}
.showcase-grid{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:170px;gap:10px}
.showcase-grid img{border-radius:var(--radius);box-shadow:var(--shadow)}
.showcase-grid img:first-child{grid-row:span 2}
.showcase-grid img:nth-child(4){grid-column:span 2}
.narrow{max-width:920px;margin:0 auto;color:var(--muted);font-size:1.15rem}`,

  "landing-impact": `.li-hero{min-height:92vh;background-size:cover;background-position:center;display:grid}
.li-overlay{background:linear-gradient(160deg,rgba(0,0,0,.74) 0%,rgba(0,0,0,.16) 100%);display:grid;align-items:end;padding:clamp(48px,8vw,108px) clamp(20px,5vw,72px);padding-bottom:clamp(80px,12vw,160px)}
.li-eyebrow{color:rgba(255,255,255,.6)!important}
.li-h1{color:white;max-width:14ch}
.li-sub{max-width:640px;font-size:1.2rem;color:rgba(255,255,255,.76);margin-top:12px}
.li-about{display:grid;grid-template-columns:1fr 1.6fr;gap:48px;align-items:start}
.li-about h2{position:sticky;top:80px}
.li-about p{font-size:1.18rem;color:var(--muted)}
.li-features{background:var(--surface)}
.li-gallery{display:grid;grid-template-columns:1.8fr 1fr 1fr;gap:8px;padding:8px;background:var(--primary)}
.li-gallery img{height:340px;border-radius:var(--radius)}`,

  "minimal-type": `.mt-header{border-bottom-color:rgba(21,27,24,.08);background:var(--paper)}
.mt-hero{padding:clamp(80px,12vw,160px) clamp(20px,5vw,72px) clamp(60px,8vw,120px);max-width:1100px}
.mt-hero h1{font-size:clamp(4rem,10vw,9.4rem);max-width:none;line-height:.88}
.mt-rule{width:48px;height:3px;background:var(--primary);margin:32px 0}
.mt-sub{max-width:560px;font-size:1.2rem;color:var(--muted);margin-bottom:32px}
.mt-about{max-width:760px;font-size:1.18rem;color:var(--muted)}
.mt-gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:clamp(0px,2vw,40px) clamp(20px,5vw,72px)}
.mt-gallery img{height:260px;border-radius:var(--radius)}
.mt-offerings{max-width:860px}
.mt-list{display:grid;gap:0}
.mt-item{display:flex;justify-content:space-between;align-items:start;gap:24px;padding:22px 0;border-bottom:1px solid rgba(21,27,24,.1)}
.mt-item h3{font-size:1.08rem;margin-bottom:4px}
.mt-item p{color:var(--muted);font-size:.95rem;margin:0}
.mt-item>span{flex-shrink:0;color:var(--primary);font-weight:850;white-space:nowrap}`,

  "dark-luxury": `.dl-main{background:#0a0907;color:#e6ddd0}
.dl-header{background:rgba(10,9,7,.96)!important;border-bottom:1px solid rgba(230,221,208,.07)!important}
.dl-header nav a,.dl-header nav{color:rgba(230,221,208,.45)}
.dl-brand{color:#e6ddd0!important}
.dl-cta{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 22px;border:1px solid var(--accent);border-radius:min(var(--radius),10px);color:var(--accent);text-decoration:none;font-weight:900;background:transparent;transition:background .2s,color .2s;cursor:pointer}
.dl-cta:hover{background:var(--accent);color:#0a0907}
.dl-hero{display:grid;grid-template-columns:1.1fr .9fr;min-height:84vh}
.dl-hero-img{overflow:hidden}
.dl-hero-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px);background:#0a0907}
.dl-h1{color:#e6ddd0;font-size:clamp(2.8rem,5vw,5.2rem)}
.dl-sub{color:rgba(230,221,208,.55);margin-top:12px;font-size:1.1rem;margin-bottom:28px}
.dl-about{background:#0d0b09}
.dl-body{color:rgba(230,221,208,.65);font-size:1.18rem;max-width:760px}
.dl-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;background:#050403}
.dl-gallery img{height:340px}
.dl-offerings{background:#0a0907}
.dl-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:28px}
.dl-card{padding:28px;border:1px solid rgba(230,221,208,.07);border-radius:var(--radius);background:rgba(230,221,208,.03)}
.dl-card h3{color:#e6ddd0}
.dl-card p{color:rgba(230,221,208,.5);margin:6px 0 0}
.dl-card span{color:var(--accent)}
.dl-testimonials{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.dl-testimonials blockquote{background:rgba(230,221,208,.03);border-color:rgba(230,221,208,.07)}
.dl-testimonials blockquote p{color:rgba(230,221,208,.7)}
.dl-testimonials blockquote footer{color:rgba(230,221,208,.35)}
.dl-main .contact-band{background:color-mix(in srgb,var(--primary) 80%,#050403)}`,

  "mosaic-visual": `.mv-opening{display:grid;grid-template-columns:1fr 380px;min-height:80vh}
.mv-mosaic{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:6px;padding:6px;background:var(--primary)}
.mv-img{border-radius:calc(var(--radius)/1.5)}
.mv-img-0{grid-row:span 2}
.mv-copy{display:grid;align-content:center;padding:clamp(48px,6vw,80px);background:white}
.mv-copy h1{font-size:clamp(2.2rem,4vw,4rem)}
.mv-copy p{color:var(--muted);margin-top:10px}
.mv-about{display:grid;grid-template-columns:1fr 1.6fr;gap:48px;align-items:start}
.mv-about p{font-size:1.15rem;color:var(--muted)}`,

  "bold-magazine": `.bm-hero{display:grid;grid-template-columns:1.1fr .9fr;min-height:76vh;background:var(--surface)}
.bm-left{display:grid;align-content:center;padding:clamp(48px,7vw,96px);gap:28px}
.bm-left h1{max-width:none}
.bm-right{overflow:hidden}
.bm-right img{height:100%;min-height:400px}
.bm-marquee{display:flex;gap:32px;padding:18px clamp(20px,5vw,72px);background:var(--primary);color:white;font-weight:900;font-size:.9rem;overflow:hidden;white-space:nowrap}
.bm-about{max-width:860px;font-size:1.18rem;color:var(--muted)}
.bm-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:0;background:var(--ink)}
.bm-feature{padding:32px 28px;border:1px solid rgba(255,255,255,.07);color:white}
.bm-num{display:block;color:var(--accent);font-size:.78rem;font-weight:950;margin-bottom:10px}
.bm-feature h3{color:white;font-size:1.12rem;margin-bottom:8px}
.bm-feature p{color:rgba(255,255,255,.5);font-size:.9rem;margin:0}
.bm-gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px}
.bm-gallery img{height:260px;border-radius:var(--radius)}`,

  "wellness-light": `.wl-main{background:#f8f5f0}
.wl-header{background:rgba(248,245,240,.9)!important}
.wl-btn{background:var(--primary);border-radius:999px!important}
.wl-hero{display:grid;grid-template-columns:.9fr 1.1fr;min-height:80vh;gap:0}
.wl-hero-img{overflow:hidden;border-radius:0 clamp(20px,4vw,60px) clamp(20px,4vw,60px) 0}
.wl-hero-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px)}
.wl-hero-copy h1{font-size:clamp(2.6rem,5vw,5rem)}
.wl-hero-copy p{color:var(--muted);font-size:1.1rem;margin-top:10px;margin-bottom:28px}
.wl-about{max-width:820px;font-size:1.22rem;color:var(--muted);background:#f8f5f0}
.wl-treatments{background:white}
.wl-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;margin-top:28px}
.wl-card{padding:28px;border:1px solid rgba(21,27,24,.07);border-radius:calc(var(--radius)*1.6);background:#f8f5f0}
.wl-card h3{margin-bottom:6px}
.wl-card p{color:var(--muted);font-size:.95rem;margin:0}
.wl-card span{color:var(--primary);font-weight:850;margin-top:10px;display:block}
.wl-gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:clamp(20px,4vw,60px);background:#f8f5f0}
.wl-gallery img{height:280px;border-radius:calc(var(--radius)*1.8);object-fit:cover}
.wl-quotes blockquote{border-radius:calc(var(--radius)*1.6)}`
};

const responsiveCss = `@media(max-width:900px){
  .bistro-hero,.intro,.service-hero,.proof-band,.studio,.two-col,.showcase-hero,.li-about,.dl-hero,.mv-opening,.bm-hero,.wl-hero{grid-template-columns:1fr}
  .studio-media{position:relative;height:58vh}
  .studio-copy header{position:static;margin-bottom:44px;flex-direction:column}
  .masonry,.gallery-strip,.showcase-grid{grid-template-columns:1fr 1fr}
  .masonry img,.masonry img:first-child{grid-column:auto;min-height:230px}
  .mv-mosaic{grid-template-rows:200px 200px}
  .mv-img-0{grid-row:auto}
  .dl-testimonials{grid-template-columns:1fr}
}
@media(max-width:620px){
  .masonry,.gallery-strip,.showcase-grid,.li-gallery,.mt-gallery,.dl-gallery,.bm-gallery,.wl-gallery{grid-template-columns:1fr}
  h1{font-size:clamp(2.55rem,16vw,4.8rem)}
  .mt-hero h1{font-size:clamp(3rem,16vw,7rem)}
}`;

export const renderWebsite = (
  intake: BusinessIntake,
  content: GeneratedContent,
  templateId: string
): { previewHtml: string; files: RenderedFile[] } => {
  const template = templates.find((t) => t.id === templateId) ?? selectTemplate(intake.businessType);
  const context: RenderContext = { intake, content, template, assets: getAssets(intake) };
  const renderer = renderers[template.id] ?? neighborhoodClassic;
  const css = `${sharedCss(intake)}\n${templateCss[template.id] ?? ""}\n${responsiveCss}`;
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
