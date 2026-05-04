import OpenAI from "openai";
import type { BusinessIntake, GeneratedContent, GenerationSource, RetrievedContext } from "../types.js";

let retryAfter = 0;

interface WebsiteContentResult {
  content: GeneratedContent;
  source: GenerationSource;
}

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
    { quote: "Friendly service, clear communication, and exactly what we needed.", author: "Local customer" },
    { quote: "A reliable neighborhood business that makes everything simple.", author: "Repeat client" }
  ],
  callToAction: intake.whatsapp ? "Message us on WhatsApp" : "Contact us today",
  seoTitle: `${intake.businessName} | ${intake.businessType} in ${intake.city}`,
  seoDescription: `${intake.businessName} offers ${intake.offerings.slice(0, 3).join(", ")} in ${intake.city}, ${intake.country}.`
});

const getErrorStatus = (error: unknown) =>
  typeof error === "object" && error !== null && "status" in error ? Number(error.status) : undefined;

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const openaiTimeoutMs = Number(process.env.OPENAI_TIMEOUT_MS ?? 15_000);

export const generateWebsiteContent = async (
  intake: BusinessIntake,
  context: RetrievedContext[]
): Promise<WebsiteContentResult> => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || process.env.DISABLE_OPENAI === "true") {
    return {
      content: fallbackContent(intake),
      source: { provider: "local-fallback", model: "template", fallback: true, message: "Content generated from template." }
    };
  }

  if (Date.now() < retryAfter) {
    return {
      content: fallbackContent(intake),
      source: { provider: "local-fallback", model: "template", fallback: true, message: "Content generated from template." }
    };
  }

  const openai = new OpenAI({ apiKey, maxRetries: 1, timeout: openaiTimeoutMs });
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
- Return only valid JSON with keys: headline, subheadline, about, offerings, testimonials, callToAction, seoTitle, seoDescription.
- Each offering must have: name, description, priceHint.
- Each testimonial must have: quote, author.`;

  try {
    console.log(`Requesting website copy from OpenAI (${model}, timeout ${openaiTimeoutMs}ms)`);
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You write concise, conversion-focused website copy for small businesses. Return only valid JSON."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    console.log("Received website copy from OpenAI");

    const text = response.choices[0]?.message.content;
    if (!text) {
      console.warn("OpenAI returned empty content; using local fallback.");
      return {
        content: fallbackContent(intake),
        source: { provider: "local-fallback", model: "template", fallback: true, message: "Content generated from template." }
      };
    }

    return {
      content: JSON.parse(text) as GeneratedContent,
      source: { provider: "openai", model, fallback: false, message: "AI-generated content." }
    };
  } catch (error) {
    const status = getErrorStatus(error);
    if (status === 429) {
      retryAfter = Date.now() + 60_000;
    }
    console.error("Content generation error; using local fallback:", getErrorMessage(error));
    return {
      content: fallbackContent(intake),
      source: { provider: "local-fallback", model: "template", fallback: true, message: "Content generated from template." }
    };
  }
};
