export type BusinessType = "restaurant" | "retail" | "services" | "beauty" | "portfolio";
export type WebsiteSection = "hero" | "about" | "services" | "products" | "menu" | "gallery" | "testimonials" | "contact";

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

export interface GeneratedSite {
  id: string;
  templateId: string;
  previewHtml: string;
  files: Array<{
    path: string;
    language: "html" | "css" | "json" | "text";
    content: string;
  }>;
  retrievedContext: Array<{
    id: string;
    title: string;
    content: string;
    score: number;
  }>;
  deploymentPlan: {
    repositoryName: string;
    suggestedHost: string;
    steps: string[];
  };
}
