import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { z } from "zod";
import { runGenerationGraph } from "./ai/generationGraph.js";
import { getGeneration, initializeDatabase, listGenerations, saveGeneration } from "./db/database.js";
import { templates } from "./templates/templates.js";

dotenv.config();
initializeDatabase();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:4200" }));
app.use(express.json({ limit: "1mb" }));

const intakeSchema = z.object({
  businessName: z.string().min(2),
  businessType: z.enum(["restaurant", "retail", "services", "beauty", "portfolio"]),
  city: z.string().min(2),
  country: z.string().min(2),
  language: z.enum(["en", "es", "pt"]),
  description: z.string().min(20),
  audience: z.string().min(2),
  brandTone: z.enum(["warm", "modern", "premium", "playful", "traditional"]),
  colors: z.string().min(2),
  heroImageUrl: z.string().url().optional().or(z.literal("")),
  galleryImageUrls: z.array(z.string().url()).optional(),
  sections: z.array(z.enum(["hero", "about", "services", "products", "menu", "gallery", "testimonials", "contact"])).min(2),
  offerings: z.array(z.string().min(1)).min(1),
  contactEmail: z.string().email(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  socialLinks: z.string().optional()
});

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, service: "pixora-api" });
});

app.get("/api/templates", (_request, response) => {
  response.json({ templates });
});

app.get("/api/generations", (_request, response) => {
  response.json({ generations: listGenerations() });
});

app.get("/api/generations/:id", (request, response) => {
  const site = getGeneration(request.params.id);
  if (!site) {
    response.status(404).json({ message: "Generation not found" });
    return;
  }

  response.json(site);
});

app.post("/api/generate", async (request, response, next) => {
  try {
    const intake = intakeSchema.parse(request.body);
    const site = await runGenerationGraph(intake);
    saveGeneration(intake, site);
    response.json(site);
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    response.status(400).json({ message: "Invalid intake data", issues: error.issues });
    return;
  }

  console.error(error);
  response.status(500).json({ message: "Unexpected server error" });
});

app.listen(port, () => {
  console.log(`Pixora API listening on http://localhost:${port}`);
});
