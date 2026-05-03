import { GoogleGenAI, Type } from "@google/genai";
import type { BusinessIntake, GeneratedContent, RetrievedContext } from "../types.js";

const fallbackContent = (intake: BusinessIntake): GeneratedContent => ({
  headline: `${intake.businessName} brings ${intake.brandTone} local service to ${intake.city}`,
  subheadline: `Discover ${intake.offerings.slice(0, 3).join(", ")} from a trusted ${intake.businessType} business in ${intake.country}.`,
  about: `${intake.businessName} serves ${intake.audience} with a practical, welcoming experience built around ${intake.description}`,
  offerings: intake.offerings.slice(0, 6).map((offering) => ({
    name: offering,
    description: `A customer-friendly option from ${intake.businessName}, designed for ${intake.audience}.`,
    priceHint: "Contact for details"
  })),
  testimonials: [
    {
      quote: "Friendly service, clear communication, and exactly what we needed.",
      author: "Local customer"
    },
    {
      quote: "A reliable neighborhood business that makes everything simple.",
      author: "Repeat client"
    }
  ],
  callToAction: intake.whatsapp ? "Message us on WhatsApp" : "Contact us today",
  seoTitle: `${intake.businessName} | ${intake.businessType} in ${intake.city}`,
  seoDescription: `${intake.businessName} offers ${intake.offerings.slice(0, 3).join(", ")} in ${intake.city}, ${intake.country}.`
});

const schema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    subheadline: { type: Type.STRING },
    about: { type: Type.STRING },
    offerings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          priceHint: { type: Type.STRING }
        },
        required: ["name", "description"]
      }
    },
    testimonials: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          quote: { type: Type.STRING },
          author: { type: Type.STRING }
        },
        required: ["quote", "author"]
      }
    },
    callToAction: { type: Type.STRING },
    seoTitle: { type: Type.STRING },
    seoDescription: { type: Type.STRING }
  },
  required: ["headline", "subheadline", "about", "offerings", "testimonials", "callToAction", "seoTitle", "seoDescription"]
};

export const generateWebsiteContent = async (
  intake: BusinessIntake,
  context: RetrievedContext[]
): Promise<GeneratedContent> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return fallbackContent(intake);
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const prompt = `Create conversion-focused website copy for a small business.

Business intake:
${JSON.stringify(intake, null, 2)}

Retrieved guidance:
${context.map((item) => `- ${item.title}: ${item.content}`).join("\n")}

Rules:
- Write in language code "${intake.language}".
- Keep the tone "${intake.brandTone}".
- Avoid exaggerated claims.
- Produce concise copy suitable for a simple static website.
- Use the provided offerings unless a small wording improvement is helpful.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) {
      return fallbackContent(intake);
    }

    return JSON.parse(text) as GeneratedContent;
  } catch (error) {
    console.warn("Gemini generation failed. Falling back to local content.", error);
    return fallbackContent(intake);
  }
};
