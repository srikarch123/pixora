import OpenAI from "openai";
import type { BusinessIntake, GeneratedContent, RetrievedContext } from "../types.js";

let openaiRetryAfter = 0;

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

const getErrorStatus = (error: unknown) =>
  typeof error === "object" && error !== null && "status" in error ? Number(error.status) : undefined;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export const generateWebsiteContent = async (
  intake: BusinessIntake,
  context: RetrievedContext[]
): Promise<GeneratedContent> => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || process.env.DISABLE_OPENAI === "true") {
    return fallbackContent(intake);
  }

  if (Date.now() < openaiRetryAfter) {
    return fallbackContent(intake);
  }

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
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
- Use the provided offerings unless a small wording improvement is helpful.
- Return only valid JSON with these keys: headline, subheadline, about, offerings, testimonials, callToAction, seoTitle, seoDescription.
- Each offering must include name, description, and priceHint.
- Each testimonial must include quote and author.`;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You write concise, conversion-focused website copy for small businesses and return only valid JSON."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const text = response.choices[0]?.message.content;
    if (!text) {
      return fallbackContent(intake);
    }

    return JSON.parse(text) as GeneratedContent;
  } catch (error) {
    const status = getErrorStatus(error);
    const message = getErrorMessage(error);

    if (status === 429) {
      openaiRetryAfter = Date.now() + 60_000;
      console.warn("OpenAI quota or rate limit reached. Using local fallback content for the next 60 seconds.");
    } else {
      console.warn(`OpenAI generation failed. Using local fallback content. ${message}`);
    }

    return fallbackContent(intake);
  }
};
