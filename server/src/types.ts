export type BusinessType = "restaurant" | "retail" | "services" | "beauty" | "portfolio";

export type WebsiteSection =
  | "hero"
  | "about"
  | "services"
  | "products"
  | "menu"
  | "gallery"
  | "testimonials"
  | "contact";

export interface BusinessIntake {
  businessName: string;
  businessType: BusinessType;
  city: string;
  country: string;
  language: "en" | "es" | "pt";
  description: string;
  audience: string;
  brandTone: "warm" | "modern" | "premium" | "playful" | "traditional";
  colors: string;
  heroImageUrl?: string;
  galleryImageUrls?: string[];
  sections: WebsiteSection[];
  offerings: string[];
  contactEmail: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  socialLinks?: string;
}

export interface RetrievedContext {
  id: string;
  title: string;
  content: string;
  score: number;
}

export interface GeneratedContent {
  headline: string;
  subheadline: string;
  about: string;
  offerings: Array<{
    name: string;
    description: string;
    priceHint?: string;
  }>;
  testimonials: Array<{
    quote: string;
    author: string;
  }>;
  callToAction: string;
  seoTitle: string;
  seoDescription: string;
}

export interface RenderedFile {
  path: string;
  language: "html" | "css" | "json" | "text";
  content: string;
}

export interface GenerationSource {
  provider: "openai" | "local-fallback";
  model: string;
  fallback: boolean;
  message: string;
}

export interface GeneratedSite {
  id: string;
  templateId: string;
  previewHtml: string;
  files: RenderedFile[];
  content: GeneratedContent;
  generationSource: GenerationSource;
  retrievedContext: RetrievedContext[];
  deploymentPlan: {
    repositoryName: string;
    suggestedHost: "vercel" | "netlify" | "cloudflare-pages";
    steps: string[];
  };
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface GenerationSummary {
  id: string;
  businessName: string;
  businessType: BusinessType;
  templateId: string;
  createdAt: string;
}
