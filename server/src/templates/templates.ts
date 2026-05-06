import { randomInt } from "node:crypto";
import type { BusinessIntake, BusinessType, GeneratedContent, RenderedFile } from "../types.js";
import { maisonRenderers, maisonCssMap } from "./restaurant-maison.js";

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
  },

  /* ── RESTAURANT — Maison Noir variants ── */
  {
    id: "maison-luxe",
    name: "Maison Luxe",
    bestFor: ["restaurant"],
    imageGuidance: "Dark, atmospheric dining room or moody food photography. Gold/black tones shine here.",
    description: "Elegant fine-dining template with gold accents, tasting menu showcase, and a reservation-forward layout."
  },
  {
    id: "maison-azure",
    name: "Maison Azure",
    bestFor: ["restaurant"],
    imageGuidance: "Sophisticated interior or plated dish photography with cool, refined lighting.",
    description: "Fine-dining template in deep navy and steel-blue — story-first layout with an editorial feel."
  },
  {
    id: "maison-rouge",
    name: "Maison Rouge",
    bestFor: ["restaurant"],
    imageGuidance: "Dramatic, passionate food or interior photography. Rich, warm lighting works best.",
    description: "Dramatic dark-crimson fine-dining template — tasting menu leads, menu follows, bold and passionate."
  },
  {
    id: "maison-verdant",
    name: "Maison Verdant",
    bestFor: ["restaurant"],
    imageGuidance: "Garden-to-table or seasonal food photography. Natural textures and greenery welcome.",
    description: "Dark sage-green fine-dining template — tasting menu featured first, natural and sophisticated."
  },

  /* ── RESTAURANT — exclusive ── */
  {
    id: "restaurant-tableside",
    name: "Tableside",
    bestFor: ["restaurant"],
    imageGuidance: "Moody, atmospheric food or interior photo. Dark and intimate shots work best.",
    description: "Fine-dining template with a full-bleed dark hero, elegant menu row layout, and accent-gold typography."
  },
  {
    id: "restaurant-chalkboard",
    name: "Chalkboard Special",
    bestFor: ["restaurant"],
    imageGuidance: "Warm interior, candid staff, or natural-light food photo.",
    description: "Casual café template with a warm split hero and a chalkboard-style specials section."
  },
  {
    id: "restaurant-open-kitchen",
    name: "Open Kitchen",
    bestFor: ["restaurant"],
    imageGuidance: "Action shots — kitchen, plating, food close-ups, or a lively dining room.",
    description: "Modern restaurant template built around an asymmetric headline block and a horizontal photo strip."
  },
  {
    id: "restaurant-street-food",
    name: "Street Special",
    bestFor: ["restaurant"],
    imageGuidance: "Bold, vibrant food photography. Colorful dishes and high-energy shots shine here.",
    description: "High-energy fast-casual template with an accent-colored hero and oversized numbered menu cards."
  },

  /* ── RETAIL — exclusive ── */
  {
    id: "retail-editorial-spread",
    name: "Editorial Spread",
    bestFor: ["retail"],
    imageGuidance: "Full-bleed editorial or product photography. Clean backgrounds and strong composition.",
    description: "Luxury fashion editorial layout with full-height hero, alternating image-text spreads, and dramatic pacing."
  },
  {
    id: "retail-market-stall",
    name: "Market Stall",
    bestFor: ["retail"],
    imageGuidance: "Warm product or lifestyle photos. Handmade, artisan, and market shots look great.",
    description: "Artisan market template with warm rounded cards, a story-forward layout, and a crafted product grid."
  },
  {
    id: "retail-product-drop",
    name: "Product Drop",
    bestFor: ["retail"],
    imageGuidance: "High-contrast product photos on clean or dark backgrounds. Bold and graphic.",
    description: "Dark-mode urban retail template inspired by hype drops — sharp contrast, bold type, and edge."
  },
  {
    id: "retail-boutique-clean",
    name: "Boutique Clean",
    bestFor: ["retail"],
    imageGuidance: "Single hero product or lifestyle image with clean composition and a neutral background.",
    description: "Swiss-minimalist boutique template with full-height hero, extreme whitespace, and restrained elegance."
  },

  /* ── SERVICES — exclusive ── */
  {
    id: "services-agency-bold",
    name: "Agency Bold",
    bestFor: ["services"],
    imageGuidance: "Creative team, workspace, or bold work-in-progress imagery.",
    description: "Creative agency template with color-blocked rows, large numbered services, and an asymmetric about section."
  },
  {
    id: "services-local-trust",
    name: "Local Trust",
    bestFor: ["services"],
    imageGuidance: "Team, job site, or before-and-after photos. Friendly and local.",
    description: "Neighbourhood service provider template focused on checklists, trust signals, and a warm local feel."
  },
  {
    id: "services-corporate-edge",
    name: "Corporate Edge",
    bestFor: ["services"],
    imageGuidance: "Professional team portrait, modern office, or a clean service-in-action photo.",
    description: "B2B professional services template with a stat strip, process timeline, and a formal grid layout."
  },
  {
    id: "services-freelance-card",
    name: "Freelance Card",
    bestFor: ["services"],
    imageGuidance: "Professional portrait or clean personal brand photo against a simple background.",
    description: "Personal brand template for freelancers and consultants — skills-forward, card-based, and direct."
  },

  /* ── BEAUTY — exclusive ── */
  {
    id: "beauty-glam-editorial",
    name: "Glam Editorial",
    bestFor: ["beauty"],
    imageGuidance: "Dramatic, moody beauty photography. Low-key lighting and editorial composition.",
    description: "High-glamour beauty template with a dark split hero, oversized quote band, and accent-gold highlights."
  },
  {
    id: "beauty-salon-chic",
    name: "Salon Chic",
    bestFor: ["beauty"],
    imageGuidance: "Modern salon environment, stylist at work, or polished result shots.",
    description: "Modern salon template with a split hero, horizontal service cards, and an appointment-focused flow."
  },
  {
    id: "beauty-natural-glow",
    name: "Natural Glow",
    bestFor: ["beauty"],
    imageGuidance: "Bright, airy natural beauty — clean skin, botanical details, and natural light.",
    description: "Organic beauty template with soft rounded shapes, gentle surface gradients, and a calm natural aesthetic."
  },
  {
    id: "beauty-nail-pop",
    name: "Nail Pop",
    bestFor: ["beauty"],
    imageGuidance: "Close-up nail art or expressive beauty work. The bolder the colours, the better.",
    description: "Playful nail and colour beauty template with an accent mosaic hero and pill-shaped service cards."
  },

  /* ── PORTFOLIO — exclusive ── */
  {
    id: "portfolio-case-study",
    name: "Case Study",
    bestFor: ["portfolio"],
    imageGuidance: "Project screenshots, mockups, process documentation, or final result photography.",
    description: "Designer and developer portfolio with skill tags, numbered full-width case study rows, and a systematic layout."
  },
  {
    id: "portfolio-gallery-flow",
    name: "Gallery Flow",
    bestFor: ["portfolio"],
    imageGuidance: "4–6 strong portfolio images — the work speaks louder than any copy here.",
    description: "Image-first portfolio with a staggered masonry gallery, minimal chrome, and quiet supporting copy."
  },
  {
    id: "portfolio-personal-brand",
    name: "Personal Brand",
    bestFor: ["portfolio"],
    imageGuidance: "Confident professional portrait with a clear or contextual background.",
    description: "Authority-forward personal brand portfolio with a large primary-coloured hero, credential highlights, and direct contact."
  }
];

export const selectTemplate = (businessType: BusinessType, usedTemplateIds: string[] = []) => {
  const candidates = templates.filter((t) => t.bestFor.includes(businessType));
  const fresh = candidates.filter((t) => !usedTemplateIds.includes(t.id));
  const pool = fresh.length > 0 ? fresh : candidates;
  return pool[randomInt(pool.length)] ?? templates[randomInt(templates.length)];
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

const namedColorMap: Record<string, string> = {
  charcoal: "#202323",
  cream: "#fff7e8",
  gold: "#d6a43f",
  navy: "#1f2a44",
  sage: "#7f9b7a",
  "sage green": "#7f9b7a",
  teal: "#245c49",
  white: "#ffffff"
};

const cssColorPattern =
  /^(#[0-9a-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|[a-z]+)$/i;

const sanitizeCssColor = (color: string | undefined, fallback: string) => {
  const normalized = color?.trim().toLowerCase();
  if (!normalized) return fallback;
  if (namedColorMap[normalized]) return namedColorMap[normalized];
  return cssColorPattern.test(normalized) ? normalized : fallback;
};

const cssVariables = (intake: BusinessIntake) => {
  const [primary = "#245c49", accent = "#d6a43f", paper = "#fffdf8"] = intake.colors
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const sanitized = {
    primary: sanitizeCssColor(primary, "#245c49"),
    accent: sanitizeCssColor(accent, "#d6a43f"),
    paper: sanitizeCssColor(paper, "#fffdf8")
  };
  const tone = {
    warm: { radius: "18px", shadow: "0 18px 55px rgba(66,42,18,.13)", font: "ui-serif, Georgia, serif" },
    modern: { radius: "8px", shadow: "0 18px 50px rgba(18,28,35,.12)", font: "Inter, ui-sans-serif, system-ui, sans-serif" },
    premium: { radius: "2px", shadow: "0 26px 80px rgba(10,15,18,.18)", font: "ui-serif, Georgia, serif" },
    playful: { radius: "24px", shadow: "0 16px 45px rgba(31,92,73,.16)", font: "Inter, ui-sans-serif, system-ui, sans-serif" },
    traditional: { radius: "10px", shadow: "0 14px 40px rgba(50,42,31,.12)", font: "ui-serif, Georgia, serif" }
  }[intake.brandTone];
  return `:root {
  --primary: ${sanitized.primary};
  --accent: ${sanitized.accent};
  --paper: ${sanitized.paper};
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
   RESTAURANT — EXCLUSIVE RENDERERS
═══════════════════════════════════════════════════════════════ */

const restaurantTableside: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header ts-header">
  <a class="brand ts-brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
  <a class="ts-reserve" href="#contact">${escapeHtml(content.callToAction)}</a>
</header>
<main>
  <section class="ts-hero">
    <p class="eyebrow ts-eyebrow">${escapeHtml(intake.city)} &middot; fine dining</p>
    <h1 class="ts-h1">${escapeHtml(content.headline)}</h1>
    <p class="ts-sub">${escapeHtml(content.subheadline)}</p>
    <a class="ts-reserve ts-hero-cta" href="#contact">${escapeHtml(content.callToAction)}</a>
  </section>
  <div class="ts-photo"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
  <section id="about" class="section ts-story">
    <div class="ts-rule"></div>
    <p>${escapeHtml(content.about)}</p>
    <div class="ts-rule"></div>
  </section>
  <section id="offerings" class="section ts-menu">
    <p class="eyebrow">Menu highlights</p>
    <h2>${escapeHtml(intake.businessName)}</h2>
    <div class="ts-menu-list">
      ${content.offerings.map((o) => `<div class="ts-row">
        <div class="ts-row-left"><span class="ts-dish">${escapeHtml(o.name)}</span><span class="ts-desc">${escapeHtml(o.description)}</span></div>
        ${o.priceHint ? `<span class="ts-price">${escapeHtml(o.priceHint)}</span>` : ""}
      </div>`).join("")}
    </div>
  </section>
  <section class="section ts-quotes"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const restaurantChalkboard: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header">
  <a class="brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
</header>
<main>
  <section class="cb-hero">
    <div class="cb-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
    <div class="cb-hero-copy">
      <p class="eyebrow">${escapeHtml(intake.city)}</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
    </div>
  </section>
  <section id="about" class="section cb-about">
    <p class="eyebrow">Our story</p>
    <p>${escapeHtml(content.about)}</p>
  </section>
  <section id="offerings" class="cb-board">
    <p class="eyebrow cb-board-eye">Today&apos;s specials</p>
    <h2 class="cb-board-title">${escapeHtml(intake.businessName)}</h2>
    <div class="cb-board-grid">
      ${content.offerings.map((o) => `<div class="cb-item">
        <h3>${escapeHtml(o.name)}</h3>
        <p>${escapeHtml(o.description)}</p>
        ${o.priceHint ? `<span class="cb-price">${escapeHtml(o.priceHint)}</span>` : ""}
      </div>`).join("")}
    </div>
  </section>
  <section id="gallery" class="cb-gallery">${galleryHtml(assets.galleryImages.slice(0, 4))}</section>
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const restaurantOpenKitchen: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header ok-header">
  <a class="brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
  <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
</header>
<main>
  <section class="ok-hero">
    <div class="ok-headline">
      <p class="eyebrow">${escapeHtml(intake.city)}, ${escapeHtml(intake.country)}</p>
      <h1>${escapeHtml(content.headline)}</h1>
    </div>
    <div class="ok-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
  </section>
  <div class="ok-strip">${galleryHtml(assets.galleryImages.slice(0, 5))}</div>
  <section id="about" class="section ok-about">
    <div><p class="eyebrow">About</p><h2>${escapeHtml(intake.businessName)}</h2></div>
    <p>${escapeHtml(content.about)}</p>
  </section>
  <section id="offerings" class="section ok-menu">
    <p class="eyebrow">Menu</p>
    <div class="cards">${offeringCards(content)}</div>
  </section>
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const restaurantStreetFood: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header sf-header">
  <a class="brand sf-brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
</header>
<main>
  <section class="sf-hero">
    <div class="sf-copy">
      <p class="eyebrow sf-eye">${escapeHtml(intake.city)} &middot; ${escapeHtml(intake.businessType)}</p>
      <h1 class="sf-h1">${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button sf-cta" href="#offerings">${escapeHtml(content.callToAction)}</a>
    </div>
    <div class="sf-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
  </section>
  <div class="sf-marquee" aria-hidden="true">
    <span>${escapeHtml(intake.businessName)}</span><span>&middot;</span>
    <span>${escapeHtml(intake.city)}</span><span>&middot;</span>
    <span>${escapeHtml(intake.offerings.slice(0, 2).join(" &middot; "))}</span>
  </div>
  <section id="offerings" class="section sf-menu">
    <p class="eyebrow">Order now</p>
    <div class="sf-grid">
      ${content.offerings.map((o, i) => `<div class="sf-card">
        <span class="sf-num">0${i + 1}</span>
        <h3>${escapeHtml(o.name)}</h3>
        <p>${escapeHtml(o.description)}</p>
        ${o.priceHint ? `<strong class="sf-price">${escapeHtml(o.priceHint)}</strong>` : ""}
      </div>`).join("")}
    </div>
  </section>
  <section id="about" class="section sf-about"><h2>${escapeHtml(intake.businessName)}</h2><p>${escapeHtml(content.about)}</p></section>
  <section id="gallery" class="sf-gallery">${galleryHtml(assets.galleryImages.slice(0, 4))}</section>
  ${contactSection(intake)}
</main>`;

/* ═══════════════════════════════════════════════════════════════
   RETAIL — EXCLUSIVE RENDERERS
═══════════════════════════════════════════════════════════════ */

const retailEditorialSpread: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header es-header">
  <a class="brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
</header>
<main>
  <section class="es-hero">
    <img class="es-hero-bg" src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}">
    <div class="es-hero-copy">
      <p class="eyebrow es-eye">${escapeHtml(intake.city)} collection</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button" href="#offerings">${escapeHtml(content.callToAction)}</a>
    </div>
  </section>
  ${content.offerings.slice(0, 3).map((o, i) => `<section class="es-spread${i % 2 !== 0 ? " es-spread-flip" : ""}">
    <div class="es-spread-img"><img src="${escapeHtml(assets.galleryImages[i] ?? assets.heroImage)}" alt="${escapeHtml(o.name)}"></div>
    <div class="es-spread-copy">
      <p class="eyebrow">0${i + 1}</p>
      <h2>${escapeHtml(o.name)}</h2>
      <p>${escapeHtml(o.description)}</p>
      ${o.priceHint ? `<strong class="es-price">${escapeHtml(o.priceHint)}</strong>` : ""}
    </div>
  </section>`).join("")}
  <section id="about" class="section es-about"><p class="eyebrow">About</p><h2>${escapeHtml(intake.businessName)}</h2><p>${escapeHtml(content.about)}</p></section>
  <section id="gallery" class="es-gallery">${galleryHtml(assets.galleryImages)}</section>
  ${contactSection(intake)}
</main>`;

const retailMarketStall: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header ms-header">
  <a class="brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
</header>
<main>
  <section class="ms-hero">
    <div class="ms-hero-copy">
      <p class="eyebrow">${escapeHtml(intake.city)} &middot; ${escapeHtml(intake.brandTone)}</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button" href="#offerings">${escapeHtml(content.callToAction)}</a>
    </div>
    <div class="ms-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
  </section>
  <section id="about" class="section ms-story">
    <p class="eyebrow">Our story</p>
    <h2>${escapeHtml(intake.businessName)}</h2>
    <p>${escapeHtml(content.about)}</p>
  </section>
  <section id="offerings" class="section ms-products">
    <p class="eyebrow">What we make</p>
    <div class="ms-grid">${offeringCards(content, "ms-card")}</div>
  </section>
  <section id="gallery" class="ms-gallery">${galleryHtml(assets.galleryImages.slice(0, 4))}</section>
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const retailProductDrop: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header pd-header">
  <a class="brand pd-brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
  <a class="pd-btn" href="#contact">${escapeHtml(content.callToAction)}</a>
</header>
<main class="pd-main">
  <section class="pd-hero">
    <div class="pd-hero-copy">
      <p class="eyebrow pd-eye">${escapeHtml(intake.city)} drop</p>
      <h1 class="pd-h1">${escapeHtml(content.headline)}</h1>
      <p class="pd-sub">${escapeHtml(content.subheadline)}</p>
      <a class="pd-btn pd-hero-cta" href="#offerings">${escapeHtml(content.callToAction)}</a>
    </div>
    <div class="pd-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
  </section>
  <section id="offerings" class="section pd-drops">
    <p class="eyebrow pd-eye">Available now</p>
    <div class="pd-grid">
      ${content.offerings.map((o) => `<div class="pd-item">
        <h3 class="pd-item-name">${escapeHtml(o.name)}</h3>
        <p class="pd-item-desc">${escapeHtml(o.description)}</p>
        ${o.priceHint ? `<span class="pd-item-price">${escapeHtml(o.priceHint)}</span>` : ""}
      </div>`).join("")}
    </div>
  </section>
  <section id="about" class="section pd-about"><p class="pd-about-text">${escapeHtml(content.about)}</p></section>
  <section id="gallery" class="pd-gallery">${galleryHtml(assets.galleryImages.slice(0, 4))}</section>
  ${contactSection(intake)}
</main>`;

const retailBoutiqueClean: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header bc-header">
  <a class="brand bc-brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
  <a class="bc-link" href="#contact">${escapeHtml(content.callToAction)}</a>
</header>
<main>
  <section class="bc-hero"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></section>
  <section id="about" class="section bc-intro">
    <div class="bc-intro-inner">
      <p class="eyebrow">${escapeHtml(intake.city)}</p>
      <h2>${escapeHtml(content.headline)}</h2>
      <p>${escapeHtml(content.about)}</p>
    </div>
  </section>
  <section id="offerings" class="bc-catalog">
    ${content.offerings.map((o, i) => `<div class="bc-item${i % 2 !== 0 ? " bc-item-alt" : ""}">
      <div class="bc-item-img"><img src="${escapeHtml(assets.galleryImages[i] ?? assets.heroImage)}" alt="${escapeHtml(o.name)}"></div>
      <div class="bc-item-copy">
        <h3>${escapeHtml(o.name)}</h3>
        <p>${escapeHtml(o.description)}</p>
        ${o.priceHint ? `<span class="bc-price">${escapeHtml(o.priceHint)}</span>` : ""}
      </div>
    </div>`).join("")}
  </section>
  <section class="section bc-quotes"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

/* ═══════════════════════════════════════════════════════════════
   SERVICES — EXCLUSIVE RENDERERS
═══════════════════════════════════════════════════════════════ */

const servicesAgencyBold: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header ab-header">
  <a class="brand ab-brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
  <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
</header>
<main>
  <section class="ab-hero">
    <div class="ab-hero-inner">
      <p class="eyebrow ab-eye">${escapeHtml(intake.city)} &middot; ${escapeHtml(intake.brandTone)}</p>
      <h1>${escapeHtml(content.headline)}</h1>
    </div>
    <p class="ab-sub">${escapeHtml(content.subheadline)}</p>
  </section>
  <section id="offerings" class="ab-services">
    ${content.offerings.map((o, i) => `<div class="ab-row${i % 2 !== 0 ? " ab-alt" : ""}">
      <span class="ab-num">0${i + 1}</span>
      <div class="ab-row-copy"><h2>${escapeHtml(o.name)}</h2><p>${escapeHtml(o.description)}</p></div>
      ${o.priceHint ? `<span class="ab-price">${escapeHtml(o.priceHint)}</span>` : ""}
    </div>`).join("")}
  </section>
  <section id="about" class="ab-about">
    <div class="ab-about-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
    <div class="ab-about-copy"><p class="eyebrow">About</p><h2>${escapeHtml(intake.businessName)}</h2><p>${escapeHtml(content.about)}</p></div>
  </section>
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const servicesLocalTrust: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header">
  <a class="brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
  <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
</header>
<main>
  <section class="lt-hero">
    <div class="lt-hero-copy">
      <p class="eyebrow">${escapeHtml(intake.city)}, ${escapeHtml(intake.country)}</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <div class="lt-checks">
        ${intake.offerings.slice(0, 4).map((o) => `<span class="lt-check">&#10003; ${escapeHtml(o)}</span>`).join("")}
      </div>
      <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
    </div>
    <div class="lt-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
  </section>
  <section id="offerings" class="section lt-services">
    <p class="eyebrow">What we do</p>
    <div class="cards">${offeringCards(content)}</div>
  </section>
  <section id="about" class="section lt-about"><p>${escapeHtml(content.about)}</p></section>
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const servicesCorporateEdge: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header ce-header">
  <a class="brand ce-brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
  <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
</header>
<main>
  <section class="ce-hero">
    <div class="ce-hero-copy">
      <p class="eyebrow ce-eye">${escapeHtml(intake.city)} &middot; ${escapeHtml(intake.country)}</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
    </div>
    <div class="ce-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
  </section>
  <div class="ce-stats">
    ${intake.offerings.slice(0, 3).map((o, i) => `<div class="ce-stat"><span class="ce-stat-n">0${i + 1}</span><span>${escapeHtml(o)}</span></div>`).join("")}
  </div>
  <section id="offerings" class="section ce-services">
    <p class="eyebrow">Services</p>
    <div class="cards">${offeringCards(content)}</div>
  </section>
  <section id="about" class="section ce-about">
    <p class="eyebrow">About</p>
    <div class="ce-about-grid"><h2>${escapeHtml(intake.businessName)}</h2><p>${escapeHtml(content.about)}</p></div>
  </section>
  <div class="ce-process section">
    <p class="eyebrow">How it works</p>
    <div class="ce-steps">
      ${content.offerings.slice(0, 4).map((o, i) => `<div class="ce-step"><span class="ce-step-n">${i + 1}</span><h3>${escapeHtml(o.name)}</h3></div>`).join("")}
    </div>
  </div>
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const servicesFreelanceCard: TemplateRenderer = ({ intake, content, assets }) => `
<main class="fc-main">
  <header class="site-header fc-header">
    <a class="brand" href="#">${escapeHtml(intake.businessName)}</a>
    ${nav(intake)}
    <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
  </header>
  <section class="fc-hero">
    <div class="fc-hero-copy">
      <p class="eyebrow fc-eye">${escapeHtml(intake.city)} &middot; available now</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p class="fc-sub">${escapeHtml(content.subheadline)}</p>
      <div class="fc-tags">
        ${intake.offerings.slice(0, 5).map((o) => `<span class="fc-tag">${escapeHtml(o)}</span>`).join("")}
      </div>
      <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
    </div>
    <div class="fc-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
  </section>
  <section id="about" class="section fc-about">
    <div class="fc-about-card">
      <p class="eyebrow">About</p>
      <h2>${escapeHtml(intake.businessName)}</h2>
      <p>${escapeHtml(content.about)}</p>
    </div>
  </section>
  <section id="offerings" class="section fc-services">
    <p class="eyebrow">Services</p>
    <div class="fc-list">
      ${content.offerings.map((o) => `<div class="fc-service">
        <h3>${escapeHtml(o.name)}</h3>
        <p>${escapeHtml(o.description)}</p>
        ${o.priceHint ? `<span class="fc-price">${escapeHtml(o.priceHint)}</span>` : ""}
      </div>`).join("")}
    </div>
  </section>
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

/* ═══════════════════════════════════════════════════════════════
   BEAUTY — EXCLUSIVE RENDERERS
═══════════════════════════════════════════════════════════════ */

const beautyGlamEditorial: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header bge-header">
  <a class="brand bge-brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
  <a class="bge-btn" href="#contact">${escapeHtml(content.callToAction)}</a>
</header>
<main class="bge-main">
  <section class="bge-hero">
    <div class="bge-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
    <div class="bge-hero-copy">
      <p class="eyebrow bge-eye">${escapeHtml(intake.city)} &middot; beauty</p>
      <h1 class="bge-h1">${escapeHtml(content.headline)}</h1>
      <p class="bge-sub">${escapeHtml(content.subheadline)}</p>
      <a class="bge-btn" href="#offerings">${escapeHtml(content.callToAction)}</a>
    </div>
  </section>
  <div class="bge-quote-band">
    <blockquote class="bge-quote">&ldquo;${escapeHtml(content.testimonials[0]?.quote ?? content.subheadline)}&rdquo;</blockquote>
  </div>
  <section id="offerings" class="section bge-services">
    <p class="eyebrow bge-eye">Services</p>
    <div class="bge-cards">${offeringCards(content, "bge-card")}</div>
  </section>
  <section id="gallery" class="bge-gallery">${galleryHtml(assets.galleryImages)}</section>
  <section id="about" class="section bge-about">
    <p class="eyebrow bge-eye">About</p>
    <h2 class="bge-about-h2">${escapeHtml(intake.businessName)}</h2>
    <p class="bge-about-p">${escapeHtml(content.about)}</p>
  </section>
  ${contactSection(intake)}
</main>`;

const beautySalonChic: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header">
  <a class="brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
  <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
</header>
<main>
  <section class="bsc-hero">
    <div class="bsc-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
    <div class="bsc-hero-copy">
      <p class="eyebrow">${escapeHtml(intake.city)}</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
    </div>
  </section>
  <section id="offerings" class="section bsc-services">
    <p class="eyebrow">Our services</p>
    <h2>For ${escapeHtml(intake.audience)}</h2>
    <div class="bsc-cards">
      ${content.offerings.map((o) => `<div class="bsc-card">
        <h3>${escapeHtml(o.name)}</h3>
        <p>${escapeHtml(o.description)}</p>
        ${o.priceHint ? `<strong class="bsc-price">${escapeHtml(o.priceHint)}</strong>` : ""}
      </div>`).join("")}
    </div>
  </section>
  <section id="gallery" class="bsc-gallery">${galleryHtml(assets.galleryImages.slice(0, 4))}</section>
  <section id="about" class="section bsc-about">
    <div class="bsc-about-copy"><p class="eyebrow">About</p><h2>${escapeHtml(intake.businessName)}</h2><p>${escapeHtml(content.about)}</p></div>
    <div class="bsc-about-quotes"><div class="cards">${testimonialBlock(content)}</div></div>
  </section>
  ${contactSection(intake)}
</main>`;

const beautyNaturalGlow: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header ng-header">
  <a class="brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
  <a class="button ng-btn" href="#contact">${escapeHtml(content.callToAction)}</a>
</header>
<main class="ng-main">
  <section class="section ng-hero">
    <div class="ng-hero-copy">
      <p class="eyebrow">${escapeHtml(intake.city)}</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button ng-btn" href="#offerings">${escapeHtml(content.callToAction)}</a>
    </div>
    <div class="ng-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
  </section>
  <section id="about" class="section ng-about">
    <p class="eyebrow">Natural &middot; honest &middot; local</p>
    <p>${escapeHtml(content.about)}</p>
  </section>
  <section id="offerings" class="section ng-treatments">
    <p class="eyebrow">Treatments</p>
    <h2>For ${escapeHtml(intake.audience)}</h2>
    <div class="ng-cards">
      ${content.offerings.map((o) => `<div class="ng-card">
        <h3>${escapeHtml(o.name)}</h3>
        <p>${escapeHtml(o.description)}</p>
        ${o.priceHint ? `<span class="ng-price">${escapeHtml(o.priceHint)}</span>` : ""}
      </div>`).join("")}
    </div>
  </section>
  <section id="gallery" class="ng-gallery">${galleryHtml(assets.galleryImages.slice(0, 4))}</section>
  <section class="section ng-quotes"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const beautyNailPop: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header np-header">
  <a class="brand np-brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
  <a class="np-btn" href="#contact">${escapeHtml(content.callToAction)}</a>
</header>
<main>
  <section class="np-hero">
    <div class="np-hero-copy">
      <p class="eyebrow np-eye">${escapeHtml(intake.city)} &middot; beauty</p>
      <h1 class="np-h1">${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="np-btn np-hero-btn" href="#offerings">${escapeHtml(content.callToAction)}</a>
    </div>
    <div class="np-mosaic">
      ${assets.galleryImages.slice(0, 4).map((img, i) => `<img src="${escapeHtml(img)}" alt="Gallery ${i + 1}" class="np-tile">`).join("")}
    </div>
  </section>
  <section id="offerings" class="section np-services">
    <p class="eyebrow">What we offer</p>
    <div class="np-pills">
      ${content.offerings.map((o) => `<div class="np-pill">
        <h3>${escapeHtml(o.name)}</h3>
        <p>${escapeHtml(o.description)}</p>
        ${o.priceHint ? `<span class="np-pill-price">${escapeHtml(o.priceHint)}</span>` : ""}
      </div>`).join("")}
    </div>
  </section>
  <section id="about" class="section np-about"><p>${escapeHtml(content.about)}</p></section>
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

/* ═══════════════════════════════════════════════════════════════
   PORTFOLIO — EXCLUSIVE RENDERERS
═══════════════════════════════════════════════════════════════ */

const portfolioCaseStudy: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header cs-header">
  <a class="brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
  <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
</header>
<main>
  <section class="section cs-hero">
    <p class="eyebrow">${escapeHtml(intake.city)} &middot; ${escapeHtml(intake.businessType)}</p>
    <h1>${escapeHtml(content.headline)}</h1>
    <p class="cs-sub">${escapeHtml(content.subheadline)}</p>
    <div class="cs-skills">
      ${intake.offerings.slice(0, 6).map((o) => `<span class="cs-skill">${escapeHtml(o)}</span>`).join("")}
    </div>
  </section>
  <div class="cs-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
  <section id="about" class="section cs-about">
    <p class="eyebrow">About</p>
    <div class="cs-about-grid"><h2>${escapeHtml(intake.businessName)}</h2><p>${escapeHtml(content.about)}</p></div>
  </section>
  <section id="offerings" class="cs-work">
    ${content.offerings.map((o, i) => `<div class="cs-case">
      <div class="cs-case-num">0${i + 1}</div>
      <div class="cs-case-img"><img src="${escapeHtml(assets.galleryImages[i] ?? assets.heroImage)}" alt="${escapeHtml(o.name)}"></div>
      <div class="cs-case-copy">
        <h2>${escapeHtml(o.name)}</h2>
        <p>${escapeHtml(o.description)}</p>
        ${o.priceHint ? `<span class="cs-tag">${escapeHtml(o.priceHint)}</span>` : ""}
      </div>
    </div>`).join("")}
  </section>
  <section class="section"><div class="cards">${testimonialBlock(content)}</div></section>
  ${contactSection(intake)}
</main>`;

const portfolioGalleryFlow: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header gf-header">
  <a class="brand gf-brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
</header>
<main>
  <section class="gf-hero">
    <div class="gf-hero-copy">
      <h1>${escapeHtml(content.headline)}</h1>
      <p>${escapeHtml(content.subheadline)}</p>
      <a class="button gf-btn" href="#gallery">${escapeHtml(content.callToAction)}</a>
    </div>
    <div class="gf-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
  </section>
  <section id="gallery" class="gf-masonry">
    ${assets.galleryImages.map((img, i) => `<img src="${escapeHtml(img)}" alt="${escapeHtml(intake.businessName)} ${i + 1}" loading="lazy" class="gf-img gf-img-${i % 3}">`).join("")}
  </section>
  <section id="about" class="section gf-about"><p>${escapeHtml(content.about)}</p></section>
  <section id="offerings" class="section gf-services">
    <p class="eyebrow">Services</p>
    <div class="gf-list">
      ${content.offerings.map((o) => `<div class="gf-item"><h3>${escapeHtml(o.name)}</h3><p>${escapeHtml(o.description)}</p>${o.priceHint ? `<span class="gf-price">${escapeHtml(o.priceHint)}</span>` : ""}</div>`).join("")}
    </div>
  </section>
  ${contactSection(intake)}
</main>`;

const portfolioPersonalBrand: TemplateRenderer = ({ intake, content, assets }) => `
<header class="site-header pb-header">
  <a class="brand pb-brand" href="#">${escapeHtml(intake.businessName)}</a>
  ${nav(intake)}
  <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
</header>
<main>
  <section class="pb-hero">
    <div class="pb-hero-copy">
      <p class="eyebrow pb-eye">${escapeHtml(intake.city)} &middot; ${escapeHtml(intake.businessType)}</p>
      <h1 class="pb-name">${escapeHtml(intake.businessName)}</h1>
      <p class="pb-tagline">${escapeHtml(content.headline)}</p>
      <p class="pb-sub">${escapeHtml(content.subheadline)}</p>
      <a class="button" href="#contact">${escapeHtml(content.callToAction)}</a>
    </div>
    <div class="pb-hero-img"><img src="${escapeHtml(assets.heroImage)}" alt="${escapeHtml(intake.businessName)}"></div>
  </section>
  <section id="about" class="section pb-about">
    <div class="pb-about-card">
      <p class="eyebrow">About</p>
      <p>${escapeHtml(content.about)}</p>
    </div>
  </section>
  <section id="offerings" class="section pb-work">
    <p class="eyebrow">What I offer</p>
    <div class="pb-grid">${offeringCards(content, "pb-card")}</div>
  </section>
  <section class="section pb-proof">
    <p class="eyebrow">What clients say</p>
    <div class="cards">${testimonialBlock(content)}</div>
  </section>
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
  "wellness-light": wellnessLight,
  /* maison noir variants */
  ...maisonRenderers,
  /* restaurant */
  "restaurant-tableside": restaurantTableside,
  "restaurant-chalkboard": restaurantChalkboard,
  "restaurant-open-kitchen": restaurantOpenKitchen,
  "restaurant-street-food": restaurantStreetFood,
  /* retail */
  "retail-editorial-spread": retailEditorialSpread,
  "retail-market-stall": retailMarketStall,
  "retail-product-drop": retailProductDrop,
  "retail-boutique-clean": retailBoutiqueClean,
  /* services */
  "services-agency-bold": servicesAgencyBold,
  "services-local-trust": servicesLocalTrust,
  "services-corporate-edge": servicesCorporateEdge,
  "services-freelance-card": servicesFreelanceCard,
  /* beauty */
  "beauty-glam-editorial": beautyGlamEditorial,
  "beauty-salon-chic": beautySalonChic,
  "beauty-natural-glow": beautyNaturalGlow,
  "beauty-nail-pop": beautyNailPop,
  /* portfolio */
  "portfolio-case-study": portfolioCaseStudy,
  "portfolio-gallery-flow": portfolioGalleryFlow,
  "portfolio-personal-brand": portfolioPersonalBrand
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
.wl-quotes blockquote{border-radius:calc(var(--radius)*1.6)}`,

  /* ── MAISON NOIR VARIANTS ── */
  ...maisonCssMap,

  /* ── RESTAURANT EXCLUSIVE ── */
  "restaurant-tableside": `.ts-header{background:var(--ink)!important;border-bottom-color:rgba(200,188,160,.08)!important}
.ts-brand{color:var(--paper)!important}
.ts-header nav,.ts-header nav a{color:rgba(200,188,160,.45)!important}
.ts-reserve{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 20px;border:1px solid var(--accent);border-radius:min(var(--radius),5px);color:var(--accent);text-decoration:none;font-weight:900;font-size:.85rem;letter-spacing:.05em;white-space:nowrap}
.ts-hero{display:grid;place-items:center;text-align:center;min-height:86vh;padding:clamp(80px,12vw,160px) clamp(20px,5vw,72px);background:var(--ink);color:var(--paper)}
.ts-eyebrow{color:rgba(200,188,160,.38)!important;letter-spacing:.12em}
.ts-h1{color:var(--paper);max-width:none;margin-bottom:18px}
.ts-sub{color:rgba(200,188,160,.6);font-size:1.18rem;max-width:580px;margin:0 auto 30px}
.ts-hero-cta{font-size:.95rem}
.ts-photo{height:54vh;overflow:hidden}
.ts-photo img{height:100%;object-position:center}
.ts-story{max-width:680px;margin:0 auto;text-align:center;font-size:1.18rem;color:var(--muted)}
.ts-rule{width:36px;height:1px;background:var(--accent);margin:26px auto}
.ts-menu{background:var(--surface)}
.ts-menu h2{margin-bottom:30px}
.ts-menu-list{border-top:1px solid rgba(21,27,24,.1)}
.ts-row{display:flex;justify-content:space-between;align-items:start;gap:16px;padding:16px 0;border-bottom:1px solid rgba(21,27,24,.08)}
.ts-row-left{display:flex;flex-direction:column;gap:3px}
.ts-dish{font-weight:850}
.ts-desc{color:var(--muted);font-size:.86rem}
.ts-price{color:var(--accent);font-weight:900;white-space:nowrap;flex-shrink:0;font-size:.95rem}`,

  "restaurant-chalkboard": `.cb-hero{display:grid;grid-template-columns:1fr 1fr;min-height:68vh}
.cb-hero-img{overflow:hidden}
.cb-hero-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px);background:var(--surface)}
.cb-hero-copy h1{max-width:none}
.cb-hero-copy p{color:var(--muted);font-size:1.08rem;margin:10px 0 24px}
.cb-about{max-width:720px;font-size:1.12rem;color:var(--muted)}
.cb-board{padding:clamp(54px,8vw,108px) clamp(20px,5vw,72px);background:var(--primary)}
.cb-board-eye{color:color-mix(in srgb,var(--accent) 82%,white)!important}
.cb-board-title{color:white;margin-bottom:36px}
.cb-board-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}
.cb-item{padding:22px;border:1px solid rgba(255,255,255,.14);border-radius:var(--radius)}
.cb-item h3{color:white;font-size:1rem;margin-bottom:6px}
.cb-item p{color:rgba(255,255,255,.58);font-size:.88rem;margin:0}
.cb-price{color:var(--accent);font-weight:900;display:block;margin-top:8px}
.cb-gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:5px;background:var(--surface)}
.cb-gallery img{height:230px;border-radius:var(--radius)}`,

  "restaurant-open-kitchen": `.ok-header{background:white!important}
.ok-hero{display:grid;grid-template-columns:1fr 1fr;min-height:70vh;border-bottom:3px solid var(--primary)}
.ok-headline{display:grid;align-content:end;padding:clamp(48px,7vw,96px);background:var(--surface)}
.ok-headline h1{max-width:none}
.ok-hero-img{overflow:hidden}
.ok-strip{display:grid;grid-template-columns:repeat(5,1fr);height:220px;gap:3px;background:var(--ink)}
.ok-strip img{height:100%;border-radius:0}
.ok-about{display:grid;grid-template-columns:.65fr 1.35fr;gap:44px;align-items:start}
.ok-about p{font-size:1.14rem;color:var(--muted)}
.ok-menu{background:var(--surface)}`,

  "restaurant-street-food": `.sf-header{background:var(--accent)!important;border-bottom:none!important}
.sf-brand,.sf-header nav a,.sf-header nav{color:white!important}
.sf-hero{display:grid;grid-template-columns:1.15fr .85fr;min-height:74vh;background:var(--accent)}
.sf-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px)}
.sf-eye{color:rgba(255,255,255,.62)!important}
.sf-h1{color:white;font-size:clamp(3rem,8vw,8rem);line-height:.88;max-width:none}
.sf-copy>p{color:rgba(255,255,255,.78);font-size:1.08rem;margin:12px 0 26px}
.sf-cta{background:var(--ink)!important}
.sf-hero-img{overflow:hidden;margin:clamp(16px,3vw,36px);border-radius:var(--radius)}
.sf-marquee{display:flex;gap:24px;padding:13px clamp(20px,5vw,72px);background:var(--ink);color:white;font-weight:900;font-size:.84rem;overflow:hidden;white-space:nowrap}
.sf-menu{background:var(--surface)}
.sf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0;margin-top:24px}
.sf-card{padding:28px 24px 24px;border:1px solid rgba(21,27,24,.1);position:relative;padding-top:54px}
.sf-num{position:absolute;top:18px;left:20px;color:var(--accent);font-size:1.5rem;font-weight:950;line-height:1}
.sf-card h3{font-size:1rem;margin-bottom:5px}
.sf-card p{color:var(--muted);font-size:.88rem;margin:0}
.sf-price{color:var(--primary);font-weight:900;display:block;margin-top:8px}
.sf-about{background:var(--primary);color:white}
.sf-about h2{color:white}
.sf-about p{color:rgba(255,255,255,.72);font-size:1.1rem}
.sf-gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px;background:var(--ink)}
.sf-gallery img{height:220px}`,

  /* ── RETAIL EXCLUSIVE ── */
  "retail-editorial-spread": `.es-header{background:white!important;border-bottom:1px solid rgba(21,27,24,.06)!important}
.es-hero{position:relative;min-height:90vh;display:grid;overflow:hidden}
.es-hero-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center}
.es-hero-copy{position:relative;display:grid;align-content:end;padding:clamp(60px,9vw,130px);background:linear-gradient(to top,rgba(10,12,11,.82) 0%,rgba(10,12,11,.1) 55%)}
.es-hero-copy h1{color:white;max-width:none}
.es-hero-copy>p{color:rgba(255,255,255,.7);font-size:1.1rem;margin:10px 0 24px;max-width:560px}
.es-eye{color:rgba(255,255,255,.45)!important}
.es-spread{display:grid;grid-template-columns:1fr 1fr;min-height:60vh}
.es-spread-flip{direction:rtl}.es-spread-flip>*{direction:ltr}
.es-spread-img{overflow:hidden}
.es-spread-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px);background:var(--surface)}
.es-spread-copy h2{font-size:clamp(1.8rem,3.5vw,3.2rem);line-height:1}
.es-spread-copy p{color:var(--muted);font-size:1.05rem;margin:10px 0}
.es-price{color:var(--accent);font-size:1.1rem;font-weight:900}
.es-about{max-width:820px}
.es-about p{color:var(--muted);font-size:1.12rem}
.es-gallery{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;padding:5px;background:var(--ink)}
.es-gallery img{grid-column:span 2;height:280px}
.es-gallery img:first-child{grid-column:span 3;height:400px}`,

  "retail-market-stall": `.ms-header{background:var(--surface)!important}
.ms-hero{display:grid;grid-template-columns:1fr 1fr;min-height:68vh}
.ms-hero-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px);background:var(--surface)}
.ms-hero-copy h1{max-width:none}
.ms-hero-copy>p{color:var(--muted);font-size:1.08rem;margin:10px 0 24px}
.ms-hero-img{overflow:hidden}
.ms-story{max-width:760px;background:white}
.ms-story h2{font-size:clamp(1.8rem,3vw,3rem)}
.ms-story p{color:var(--muted);font-size:1.12rem;margin-top:10px}
.ms-products{background:var(--surface)}
.ms-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;margin-top:24px}
.ms-card{padding:26px;border-radius:calc(var(--radius)*1.4);background:white;border:1px solid rgba(21,27,24,.08)}
.ms-card h3{font-size:1.02rem;margin-bottom:6px}
.ms-card p{color:var(--muted);font-size:.9rem;margin:0}
.ms-card span{color:var(--accent);font-weight:900;display:block;margin-top:8px}
.ms-gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px;background:var(--surface)}
.ms-gallery img{height:240px;border-radius:var(--radius)}`,

  "retail-product-drop": `.pd-main{background:var(--ink);color:var(--paper)}
.pd-header{background:rgba(21,27,24,.97)!important;border-bottom:1px solid rgba(255,255,255,.05)!important}
.pd-brand,.pd-header nav a,.pd-header nav{color:rgba(230,230,220,.7)!important}
.pd-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 18px;border:1px solid var(--accent);border-radius:min(var(--radius),4px);color:var(--accent);text-decoration:none;font-weight:900;font-size:.84rem;letter-spacing:.06em;background:transparent;white-space:nowrap}
.pd-hero{display:grid;grid-template-columns:1.1fr .9fr;min-height:80vh}
.pd-hero-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px);background:var(--ink)}
.pd-eye{color:rgba(230,230,220,.32)!important;letter-spacing:.1em}
.pd-h1{color:var(--paper);max-width:none;font-size:clamp(3rem,7vw,7.5rem);line-height:.86}
.pd-sub{color:rgba(230,230,220,.5);font-size:1.08rem;margin:14px 0 28px}
.pd-hero-cta{align-self:start}
.pd-hero-img{overflow:hidden}
.pd-drops{background:color-mix(in srgb,var(--ink) 94%,white)}
.pd-eye{color:rgba(230,230,220,.32)!important}
.pd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1px;background:rgba(255,255,255,.06);margin-top:24px}
.pd-item{padding:28px;background:color-mix(in srgb,var(--ink) 94%,white)}
.pd-item-name{color:var(--paper);font-size:1.05rem;margin-bottom:6px}
.pd-item-desc{color:rgba(230,230,220,.45);font-size:.88rem;margin:0}
.pd-item-price{color:var(--accent);font-weight:900;display:block;margin-top:8px}
.pd-about{max-width:760px}
.pd-about-text{font-size:1.15rem;color:rgba(230,230,220,.55)}
.pd-gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;background:rgba(255,255,255,.04)}
.pd-gallery img{height:260px}
.pd-main .contact-band{background:color-mix(in srgb,var(--primary) 85%,#050403)}`,

  "retail-boutique-clean": `.bc-header{background:white!important;border-bottom:1px solid rgba(21,27,24,.05)!important}
.bc-brand{font-weight:400;letter-spacing:.14em;text-transform:uppercase;font-size:.82rem}
.bc-link{color:var(--muted);text-decoration:underline;font-size:.88rem}
.bc-hero{height:88vh;overflow:hidden}
.bc-hero img{height:100%;object-position:center}
.bc-intro{max-width:680px;margin:0 auto;text-align:center}
.bc-intro-inner{max-width:560px;margin:0 auto}
.bc-intro h2{font-size:clamp(2rem,4vw,4rem);margin-bottom:14px}
.bc-intro p{color:var(--muted);font-size:1.1rem}
.bc-catalog{display:grid;gap:0}
.bc-item{display:grid;grid-template-columns:1fr 1fr;min-height:52vh}
.bc-item-alt{direction:rtl}.bc-item-alt>*{direction:ltr}
.bc-item-img{overflow:hidden}
.bc-item-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px);background:var(--surface)}
.bc-item-copy h3{font-family:var(--display-font);font-size:clamp(1.6rem,2.8vw,2.6rem);margin-bottom:10px}
.bc-item-copy p{color:var(--muted);font-size:1.02rem;margin-bottom:14px}
.bc-price{color:var(--accent);font-weight:900;font-size:1.05rem}
.bc-quotes{max-width:820px;margin:0 auto}`,

  /* ── SERVICES EXCLUSIVE ── */
  "services-agency-bold": `.ab-header{background:var(--paper)!important}
.ab-brand{font-weight:950;letter-spacing:-.02em}
.ab-hero{display:grid;grid-template-columns:1fr 1fr;align-items:end;min-height:72vh;background:var(--primary)}
.ab-hero-inner{display:grid;align-content:end;padding:clamp(48px,7vw,96px);padding-right:0}
.ab-eye{color:rgba(255,255,255,.45)!important}
.ab-hero h1{color:white;max-width:none;font-size:clamp(3rem,6vw,6.5rem)}
.ab-sub{grid-column:2;display:grid;align-content:center;padding:clamp(48px,7vw,96px);background:var(--accent);color:white;font-size:1.18rem;line-height:1.55;margin:0}
.ab-services{display:grid;gap:0}
.ab-row{display:grid;grid-template-columns:80px 1fr auto;align-items:center;gap:24px;padding:clamp(26px,4vw,48px) clamp(20px,5vw,72px);border-bottom:1px solid rgba(21,27,24,.1);background:white}
.ab-alt{background:var(--surface)}
.ab-num{font-family:var(--display-font);font-size:clamp(2.4rem,4vw,4rem);color:color-mix(in srgb,var(--primary) 20%,transparent);font-weight:950;line-height:1}
.ab-row-copy h2{font-size:clamp(1.3rem,2.2vw,2rem);margin-bottom:6px}
.ab-row-copy p{color:var(--muted);font-size:.94rem;margin:0}
.ab-price{color:var(--accent);font-weight:900;white-space:nowrap}
.ab-about{display:grid;grid-template-columns:1fr 1fr;min-height:52vh}
.ab-about-img{overflow:hidden}
.ab-about-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px);background:var(--ink)}
.ab-about-copy p,.ab-about-copy h2{color:white}
.ab-about-copy>p:first-child{color:rgba(255,255,255,.45)}
.ab-about-copy>p:last-child{color:rgba(255,255,255,.68);font-size:1.08rem}`,

  "services-local-trust": `.lt-hero{display:grid;grid-template-columns:1.1fr .9fr;min-height:72vh;background:var(--surface)}
.lt-hero-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px)}
.lt-hero-copy h1{max-width:none}
.lt-hero-copy>p{color:var(--muted);font-size:1.05rem;margin:10px 0 18px}
.lt-checks{display:flex;flex-direction:column;gap:8px;margin-bottom:22px}
.lt-check{display:flex;align-items:center;gap:9px;font-weight:700;color:var(--primary);font-size:.94rem}
.lt-hero-img{overflow:hidden}
.lt-services{background:var(--surface)}
.lt-about{max-width:760px;font-size:1.12rem;color:var(--muted)}`,

  "services-corporate-edge": `.ce-header{background:var(--primary)!important;border-bottom:none!important}
.ce-brand{color:white!important}
.ce-header nav,.ce-header nav a{color:rgba(255,255,255,.55)!important}
.ce-eye{color:rgba(255,255,255,.45)!important}
.ce-hero{display:grid;grid-template-columns:1.05fr .95fr;min-height:70vh;background:var(--primary);color:white}
.ce-hero-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px)}
.ce-hero-copy h1{color:white;max-width:none}
.ce-hero-copy>p{color:rgba(255,255,255,.65);font-size:1.08rem;margin:10px 0 24px}
.ce-hero-img{overflow:hidden;margin:clamp(16px,3vw,36px);border-radius:var(--radius)}
.ce-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:0;background:var(--accent)}
.ce-stat{display:flex;flex-direction:column;gap:4px;padding:22px clamp(20px,5vw,72px);border-right:1px solid rgba(255,255,255,.15)}
.ce-stat-n{font-family:var(--display-font);font-size:2rem;font-weight:950;color:white;line-height:1}
.ce-stat>span:last-child{color:rgba(255,255,255,.7);font-size:.85rem;font-weight:700}
.ce-services{background:var(--surface)}
.ce-about{background:white}
.ce-about-grid{display:grid;grid-template-columns:.7fr 1.3fr;gap:36px;margin-top:12px}
.ce-about-grid p{color:var(--muted);font-size:1.08rem}
.ce-process{background:var(--ink)}
.ce-process>.eyebrow{color:rgba(255,255,255,.45)!important;padding:0 clamp(20px,5vw,72px)}
.ce-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0;padding:clamp(20px,4vw,60px) clamp(20px,5vw,72px)}
.ce-step{padding:24px 20px;border-left:1px solid rgba(255,255,255,.1)}
.ce-step-n{display:block;font-family:var(--display-font);font-size:3rem;color:var(--accent);line-height:1;margin-bottom:10px}
.ce-step h3{color:white;font-size:1rem;margin:0}`,

  "services-freelance-card": `.fc-main{background:var(--paper)}
.fc-header{background:var(--paper)!important}
.fc-hero{display:grid;grid-template-columns:1fr 1fr;min-height:72vh;align-items:center;background:var(--surface)}
.fc-hero-copy{padding:clamp(48px,7vw,96px)}
.fc-eye{color:var(--muted)!important}
.fc-hero-copy h1{max-width:none}
.fc-sub{color:var(--muted);font-size:1.05rem;margin:10px 0 18px}
.fc-tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px}
.fc-tag{padding:5px 12px;border:1px solid var(--primary);border-radius:999px;color:var(--primary);font-size:.8rem;font-weight:850}
.fc-hero-img{overflow:hidden;margin:clamp(16px,3vw,40px);border-radius:calc(var(--radius)*1.5)}
.fc-about{background:white}
.fc-about-card{max-width:680px;padding:32px;border:1px solid rgba(21,27,24,.09);border-radius:var(--radius);background:var(--surface)}
.fc-about-card p{color:var(--muted);font-size:1.08rem;margin-top:10px}
.fc-services{background:var(--surface)}
.fc-list{display:grid;gap:0;margin-top:20px;border-top:1px solid rgba(21,27,24,.1)}
.fc-service{display:grid;grid-template-columns:1fr auto;grid-template-rows:auto auto;gap:4px 16px;align-items:start;padding:18px 0;border-bottom:1px solid rgba(21,27,24,.08)}
.fc-service h3{font-size:1rem;grid-column:1}
.fc-service p{color:var(--muted);font-size:.88rem;margin:0;grid-column:1}
.fc-price{color:var(--accent);font-weight:900;grid-column:2;grid-row:1;white-space:nowrap}`,

  /* ── BEAUTY EXCLUSIVE ── */
  "beauty-glam-editorial": `.bge-main{background:#0c0a09;color:#ede5da}
.bge-header{background:rgba(12,10,9,.96)!important;border-bottom:1px solid rgba(237,229,218,.06)!important}
.bge-brand{color:#ede5da!important}
.bge-header nav,.bge-header nav a{color:rgba(237,229,218,.38)!important}
.bge-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 22px;border:1px solid var(--accent);border-radius:min(var(--radius),6px);color:var(--accent);text-decoration:none;font-weight:900;font-size:.88rem;white-space:nowrap;background:transparent}
.bge-hero{display:grid;grid-template-columns:1fr 1fr;min-height:86vh}
.bge-hero-img{overflow:hidden}
.bge-hero-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px);background:#0c0a09}
.bge-eye{color:rgba(237,229,218,.32)!important;letter-spacing:.1em}
.bge-h1{color:#ede5da;max-width:none;font-size:clamp(2.8rem,5vw,5.5rem)}
.bge-sub{color:rgba(237,229,218,.48);font-size:1.08rem;margin:12px 0 26px}
.bge-quote-band{padding:clamp(40px,6vw,80px) clamp(20px,5vw,72px);background:var(--accent)}
.bge-quote{font-family:var(--display-font);font-size:clamp(1.4rem,3vw,2.6rem);color:white;margin:0;font-style:italic;line-height:1.28;max-width:900px}
.bge-services{background:#0f0d0b}
.bge-eye{color:rgba(237,229,218,.32)!important}
.bge-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-top:22px}
.bge-card{padding:26px;border:1px solid rgba(237,229,218,.07);border-radius:var(--radius);background:rgba(237,229,218,.02)}
.bge-card h3{color:#ede5da;margin-bottom:6px}
.bge-card p{color:rgba(237,229,218,.42);font-size:.88rem;margin:0}
.bge-card span{color:var(--accent);font-weight:900;display:block;margin-top:8px}
.bge-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:3px;background:#050302}
.bge-gallery img{height:350px}
.bge-about{background:#0c0a09}
.bge-about-h2{color:#ede5da;font-size:clamp(2rem,3.5vw,3.5rem)}
.bge-about-p{color:rgba(237,229,218,.5);font-size:1.12rem;max-width:720px}
.bge-main .contact-band{background:color-mix(in srgb,var(--primary) 75%,#050302)}`,

  "beauty-salon-chic": `.bsc-hero{display:grid;grid-template-columns:1fr 1fr;min-height:76vh}
.bsc-hero-img{overflow:hidden}
.bsc-hero-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px);background:var(--surface)}
.bsc-hero-copy h1{max-width:none}
.bsc-hero-copy>p{color:var(--muted);font-size:1.05rem;margin:10px 0 22px}
.bsc-services{background:white}
.bsc-services h2{margin-bottom:24px}
.bsc-cards{display:flex;flex-direction:column;gap:0;margin-top:24px}
.bsc-card{display:grid;grid-template-columns:1fr auto;align-items:center;gap:16px;padding:20px 24px;border-bottom:1px solid rgba(21,27,24,.09);background:white}
.bsc-card h3{font-size:1rem;margin-bottom:4px}
.bsc-card p{color:var(--muted);font-size:.88rem;margin:0}
.bsc-price{color:var(--primary);font-weight:900;white-space:nowrap}
.bsc-gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:5px;background:var(--primary)}
.bsc-gallery img{height:250px}
.bsc-about{display:grid;grid-template-columns:1fr 1fr;gap:36px;background:var(--surface)}
.bsc-about-copy p{color:var(--muted);font-size:1.05rem}`,

  "beauty-natural-glow": `.ng-main{background:color-mix(in srgb,var(--paper) 92%,white)}
.ng-header{background:color-mix(in srgb,var(--paper) 92%,white)!important}
.ng-btn{border-radius:999px!important;background:var(--primary)!important}
.ng-hero{display:grid;grid-template-columns:1fr 1fr;min-height:72vh;gap:0}
.ng-hero-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px)}
.ng-hero-copy h1{max-width:none}
.ng-hero-copy>p{color:var(--muted);font-size:1.05rem;margin:10px 0 24px}
.ng-hero-img{overflow:hidden;border-radius:0 clamp(24px,5vw,72px) clamp(24px,5vw,72px) 0}
.ng-about{max-width:700px;font-size:1.14rem;color:var(--muted);background:white;border-radius:var(--radius)}
.ng-treatments{background:white}
.ng-treatments h2{margin-bottom:22px}
.ng-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:20px}
.ng-card{padding:26px;border:1px solid rgba(21,27,24,.07);border-radius:calc(var(--radius)*1.8);background:color-mix(in srgb,var(--paper) 92%,white)}
.ng-card h3{margin-bottom:6px}
.ng-card p{color:var(--muted);font-size:.9rem;margin:0}
.ng-price{color:var(--primary);font-weight:900;display:block;margin-top:8px}
.ng-gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:clamp(20px,4vw,56px);background:white}
.ng-gallery img{height:260px;border-radius:calc(var(--radius)*2);object-fit:cover}
.ng-quotes{background:color-mix(in srgb,var(--paper) 92%,white)}
.ng-quotes blockquote{border-radius:calc(var(--radius)*1.8)}`,

  "beauty-nail-pop": `.np-header{background:var(--accent)!important;border-bottom:none!important}
.np-brand,.np-header nav a,.np-header nav{color:white!important}
.np-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 20px;border-radius:999px;background:white;color:var(--accent);text-decoration:none;font-weight:900;font-size:.88rem;white-space:nowrap}
.np-hero{display:grid;grid-template-columns:1fr 1fr;min-height:72vh;background:var(--accent)}
.np-hero-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px)}
.np-eye{color:rgba(255,255,255,.55)!important}
.np-h1{color:white;max-width:none;font-size:clamp(2.8rem,6vw,6rem)}
.np-hero-copy>p{color:rgba(255,255,255,.75);font-size:1.05rem;margin:10px 0 24px}
.np-hero-btn{margin-top:0}
.np-mosaic{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:6px;padding:clamp(16px,3vw,36px);background:color-mix(in srgb,var(--accent) 80%,black)}
.np-tile{border-radius:calc(var(--radius)*1.4)}
.np-services{background:white}
.np-pills{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:22px}
.np-pill{padding:24px;border-radius:calc(var(--radius)*2);background:color-mix(in srgb,var(--accent) 8%,white);border:1.5px solid color-mix(in srgb,var(--accent) 22%,white)}
.np-pill h3{font-size:1rem;margin-bottom:5px}
.np-pill p{color:var(--muted);font-size:.88rem;margin:0}
.np-pill-price{color:var(--accent);font-weight:900;display:block;margin-top:8px}
.np-about{max-width:720px;font-size:1.1rem;color:var(--muted)}`,

  /* ── PORTFOLIO EXCLUSIVE ── */
  "portfolio-case-study": `.cs-header{background:white!important;border-bottom:1px solid rgba(21,27,24,.07)!important}
.cs-hero{background:var(--surface);max-width:none}
.cs-hero h1{max-width:none;font-size:clamp(3rem,7vw,7rem)}
.cs-sub{color:var(--muted);font-size:1.1rem;max-width:620px;margin:10px 0 20px}
.cs-skills{display:flex;flex-wrap:wrap;gap:8px}
.cs-skill{padding:5px 14px;border:1px solid var(--primary);border-radius:999px;color:var(--primary);font-size:.8rem;font-weight:850}
.cs-hero-img{height:54vh;overflow:hidden}
.cs-hero-img img{height:100%;object-position:center}
.cs-about{background:white}
.cs-about-grid{display:grid;grid-template-columns:.7fr 1.3fr;gap:36px;margin-top:12px}
.cs-about-grid p{color:var(--muted);font-size:1.08rem}
.cs-work{display:grid;gap:0}
.cs-case{display:grid;grid-template-columns:48px 1fr 1fr;min-height:48vh;border-top:1px solid rgba(21,27,24,.1)}
.cs-case:nth-child(even){direction:rtl}.cs-case:nth-child(even)>*{direction:ltr}
.cs-case-num{display:grid;place-items:start;padding:20px 0 0 20px;font-family:var(--display-font);font-size:1.4rem;color:var(--accent);font-weight:950}
.cs-case-img{overflow:hidden}
.cs-case-copy{display:grid;align-content:center;padding:clamp(40px,6vw,80px);background:var(--surface)}
.cs-case-copy h2{font-size:clamp(1.6rem,2.8vw,2.6rem);margin-bottom:10px}
.cs-case-copy p{color:var(--muted);font-size:.98rem}
.cs-tag{display:inline-block;margin-top:10px;padding:4px 12px;border-radius:999px;background:var(--primary);color:white;font-size:.78rem;font-weight:850}`,

  "portfolio-gallery-flow": `.gf-header{background:white!important;border-bottom:1px solid rgba(21,27,24,.05)!important}
.gf-brand{font-weight:400;letter-spacing:.1em;text-transform:uppercase;font-size:.82rem}
.gf-btn{background:var(--ink)!important}
.gf-hero{display:grid;grid-template-columns:.7fr 1.3fr;min-height:66vh}
.gf-hero-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px);background:var(--surface)}
.gf-hero-copy h1{max-width:none;font-size:clamp(2.6rem,5.5vw,5.8rem)}
.gf-hero-copy>p{color:var(--muted);font-size:1.05rem;margin:10px 0 24px}
.gf-hero-img{overflow:hidden}
.gf-masonry{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:240px;gap:5px;padding:5px;background:var(--ink)}
.gf-img{border-radius:0}
.gf-img-0{grid-row:span 2}
.gf-about{max-width:720px;font-size:1.12rem;color:var(--muted)}
.gf-services{background:var(--surface)}
.gf-list{display:grid;gap:0;margin-top:18px;border-top:1px solid rgba(21,27,24,.1)}
.gf-item{display:flex;justify-content:space-between;align-items:start;gap:20px;padding:16px 0;border-bottom:1px solid rgba(21,27,24,.08)}
.gf-item h3{font-size:.98rem;margin-bottom:3px}
.gf-item p{color:var(--muted);font-size:.86rem;margin:0}
.gf-price{flex-shrink:0;color:var(--primary);font-weight:900;white-space:nowrap}`,

  "portfolio-personal-brand": `.pb-header{background:var(--primary)!important;border-bottom:none!important}
.pb-brand{color:white!important}
.pb-header nav,.pb-header nav a{color:rgba(255,255,255,.5)!important}
.pb-eye{color:rgba(255,255,255,.4)!important}
.pb-hero{display:grid;grid-template-columns:1.1fr .9fr;min-height:82vh;background:var(--primary);color:white}
.pb-hero-copy{display:grid;align-content:center;padding:clamp(48px,7vw,96px)}
.pb-name{color:white;max-width:none;font-size:clamp(3rem,7vw,7.5rem);line-height:.88;margin-bottom:8px}
.pb-tagline{color:color-mix(in srgb,var(--accent) 90%,white);font-size:clamp(1.2rem,2vw,1.8rem);font-weight:700;margin-bottom:8px}
.pb-sub{color:rgba(255,255,255,.6);font-size:1.05rem;margin:0 0 24px}
.pb-hero-img{overflow:hidden;margin:clamp(16px,3vw,40px);border-radius:var(--radius)}
.pb-about{background:var(--surface)}
.pb-about-card{max-width:680px;padding:34px;border:1px solid rgba(21,27,24,.09);border-radius:var(--radius);background:white}
.pb-about-card p{color:var(--muted);font-size:1.08rem;margin-top:10px}
.pb-work{background:white}
.pb-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:22px}
.pb-card{padding:24px;border:1px solid rgba(21,27,24,.09);border-radius:var(--radius)}
.pb-card h3{font-size:1rem;margin-bottom:5px}
.pb-card p{color:var(--muted);font-size:.88rem;margin:0}
.pb-card span{color:var(--accent);font-weight:900;display:block;margin-top:8px}
.pb-proof{background:var(--surface)}`
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
  /* restaurant exclusive */
  .cb-hero,.ok-hero,.sf-hero{grid-template-columns:1fr}
  .ok-hero{min-height:auto}
  .ok-strip{grid-template-columns:repeat(3,1fr);height:160px}
  .ok-about{grid-template-columns:1fr}
  .sf-hero{background:var(--accent)}
  .sf-hero-img{display:none}
  /* retail exclusive */
  .es-spread,.es-spread-flip,.ms-hero,.bc-item,.bc-item-alt,.pd-hero{grid-template-columns:1fr}
  .es-spread-flip{direction:ltr}
  .bc-item-alt{direction:ltr}
  .bc-hero{height:50vh}
  .es-hero{min-height:60vh}
  .es-gallery{grid-template-columns:repeat(3,1fr)}
  .es-gallery img,.es-gallery img:first-child{grid-column:auto;height:200px}
  /* services exclusive */
  .ab-hero,.ab-about,.lt-hero,.ce-hero,.fc-hero{grid-template-columns:1fr}
  .ab-hero{background:var(--primary)}
  .ab-sub{grid-column:1;background:var(--accent)}
  .ab-row{grid-template-columns:48px 1fr}
  .ab-price{grid-column:2}
  .ce-stats{grid-template-columns:1fr 1fr}
  .ce-about-grid{grid-template-columns:1fr}
  .ce-steps{grid-template-columns:1fr 1fr}
  .fc-hero-img{display:none}
  /* beauty exclusive */
  .bge-hero,.bsc-hero,.ng-hero,.np-hero{grid-template-columns:1fr}
  .bsc-about{grid-template-columns:1fr}
  /* portfolio exclusive */
  .cs-case{grid-template-columns:36px 1fr}
  .cs-case-img{display:none}
  .cs-case:nth-child(even){direction:ltr}
  .cs-about-grid{grid-template-columns:1fr}
  .gf-hero,.pb-hero{grid-template-columns:1fr}
  .gf-masonry{grid-template-columns:1fr 1fr}
  .gf-img-0{grid-row:auto}
}
@media(max-width:620px){
  .masonry,.gallery-strip,.showcase-grid,.li-gallery,.mt-gallery,.dl-gallery,.bm-gallery,.wl-gallery{grid-template-columns:1fr}
  h1{font-size:clamp(2.55rem,16vw,4.8rem)}
  .mt-hero h1{font-size:clamp(3rem,16vw,7rem)}
  /* restaurant */
  .cb-board-grid,.sf-grid{grid-template-columns:1fr}
  .cb-gallery,.ok-strip,.sf-gallery{grid-template-columns:1fr 1fr}
  /* retail */
  .es-gallery,.ms-gallery,.pd-gallery,.bc-catalog{grid-template-columns:1fr}
  .ms-grid,.pd-grid{grid-template-columns:1fr}
  /* services */
  .ce-stats,.ce-steps{grid-template-columns:1fr}
  /* beauty */
  .bge-gallery,.bsc-gallery,.ng-gallery,.np-pills{grid-template-columns:1fr 1fr}
  .bge-cards,.ng-cards{grid-template-columns:1fr}
  /* portfolio */
  .gf-masonry,.cs-work{grid-template-columns:1fr}
  .cs-case{grid-template-columns:1fr}
  .cs-case-num{display:none}
  .pb-grid{grid-template-columns:1fr}
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
