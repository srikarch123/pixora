import { createRequire } from "node:module";
import OpenAI from "openai";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;
import type { BusinessIntake, BusinessType, WebsiteSection } from "../types.js";

const VALID_BUSINESS_TYPES: BusinessType[] = ["restaurant", "retail", "services", "beauty", "portfolio"];
const VALID_TONES = ["warm", "modern", "premium", "playful", "traditional"] as const;
const VALID_LANGUAGES = ["en", "es", "pt"] as const;
const VALID_SECTIONS: WebsiteSection[] = ["hero", "about", "services", "products", "menu", "gallery", "testimonials", "contact"];

const SYSTEM_PROMPT =
  "You are a business information extractor. Extract structured data from business cards or invoices and return ONLY valid JSON. " +
  "For any field you cannot find, generate a sensible value from context. Never return null for required fields.";

const buildUserPrompt = (sourceLabel: string) => `Extract business info from this ${sourceLabel} and return JSON with EXACTLY these fields:

{
  "businessName": "full business name (required)",
  "businessType": one of ["restaurant","retail","services","beauty","portfolio"],
  "city": "city name",
  "country": "country name",
  "language": one of ["en","es","pt"] — detect from address/text or default to en,
  "description": "2-3 sentences about what the business does (min 20 chars, generate from context if not present)",
  "audience": "who their customers are (infer from business type if not visible)",
  "brandTone": one of ["warm","modern","premium","playful","traditional"],
  "colors": "brand colors as hex codes or names e.g. '#c8102e, #f5f0e8' (infer from card design or use sensible defaults)",
  "sections": array of 3-5 from ["hero","about","services","products","menu","gallery","testimonials","contact"],
  "offerings": array of 2-6 service/product name strings,
  "contactEmail": "email address — if not visible, generate one like: contact@businessname.com",
  "phone": "phone number or null",
  "address": "full address string or null",
  "socialLinks": "social handles or URLs or null"
}

Inference rules:
- businessType: restaurant/cafe→restaurant, shop/store→retail, salon/spa/barber→beauty, freelancer/consultant/photographer→portfolio, everything else→services
- brandTone: restaurant→warm, law/finance/luxury→premium, tech/startup→modern, kids/casual food→playful, traditional business→traditional
- sections: always include hero+contact; add menu for restaurants, gallery for beauty/portfolio, testimonials for services
- offerings: use invoice line items if present; otherwise infer from job title/industry (e.g. "Graphic Design" → ["Logo Design","Brand Identity","Print Design"])
- If no email visible, construct one: contact@[lowercased-business-name-no-spaces].com`;

const applyDefaults = (raw: Record<string, unknown>): BusinessIntake => {
  const businessName = String(raw.businessName || "My Business").trim() || "My Business";

  const businessType = VALID_BUSINESS_TYPES.includes(raw.businessType as BusinessType)
    ? (raw.businessType as BusinessType)
    : "services";

  const brandTone = VALID_TONES.includes(raw.brandTone as typeof VALID_TONES[number])
    ? (raw.brandTone as typeof VALID_TONES[number])
    : "modern";

  const language = VALID_LANGUAGES.includes(raw.language as typeof VALID_LANGUAGES[number])
    ? (raw.language as typeof VALID_LANGUAGES[number])
    : "en";

  const sections = (Array.isArray(raw.sections) ? raw.sections : [])
    .filter((s) => VALID_SECTIONS.includes(s as WebsiteSection))
    .slice(0, 8) as WebsiteSection[];
  const resolvedSections: WebsiteSection[] = sections.length >= 2 ? sections : ["hero", "about", "services", "contact"];

  const offerings = (Array.isArray(raw.offerings) ? raw.offerings : [])
    .map(String)
    .filter(Boolean)
    .slice(0, 6);
  const resolvedOfferings = offerings.length >= 1 ? offerings : [`${businessType} services`];

  const fallbackEmail = `contact@${businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
  const rawEmail = String(raw.contactEmail || "").trim();
  const contactEmail = rawEmail.includes("@") ? rawEmail : fallbackEmail;

  const description = String(raw.description || "").trim();

  return {
    businessName,
    businessType,
    city: String(raw.city || "").trim() || "Unknown City",
    country: String(raw.country || "").trim() || "Unknown Country",
    language,
    description: description.length >= 20 ? description : `${businessName} provides quality ${businessType} services to ${raw.audience || "local customers"}.`,
    audience: String(raw.audience || "").trim() || "Local customers and businesses",
    brandTone,
    colors: String(raw.colors || "").trim() || "#1a1a1a, #ffffff",
    sections: resolvedSections,
    offerings: resolvedOfferings,
    contactEmail,
    phone: raw.phone ? String(raw.phone).trim() : undefined,
    address: raw.address ? String(raw.address).trim() : undefined,
    socialLinks: raw.socialLinks ? String(raw.socialLinks).trim() : undefined,
  };
};

export const extractIntakeFromFile = async (buffer: Buffer, mimeType: string): Promise<BusinessIntake> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key is required for document extraction.");

  const openai = new OpenAI({ apiKey, maxRetries: 1, timeout: 30_000 });
  const model = process.env.OPENAI_VISION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  let messages: OpenAI.Chat.ChatCompletionMessageParam[];

  if (mimeType === "application/pdf") {
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text.trim().slice(0, 4000);
    if (text.length < 20) {
      throw new Error("Could not read text from this PDF. Please upload a clear image (JPG or PNG) of the document instead.");
    }
    messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `${buildUserPrompt("document")}\n\nDocument text:\n${text}` },
    ];
  } else {
    const base64 = buffer.toString("base64");
    messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: buildUserPrompt("image") },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" } },
        ],
      },
    ];
  }

  console.log(`Extracting intake from ${mimeType} file using ${model}`);
  const response = await openai.chat.completions.create({
    model,
    messages,
    response_format: { type: "json_object" },
    max_tokens: 1000,
  });

  const text = response.choices[0]?.message.content;
  if (!text) throw new Error("AI returned no response. Please try again.");

  const raw = JSON.parse(text) as Record<string, unknown>;
  console.log(`Extracted intake for: ${raw.businessName ?? "unknown"}`);
  return applyDefaults(raw);
};
