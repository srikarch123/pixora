import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { z } from "zod";
import { runGenerationGraph } from "./ai/generationGraph.js";
import {
  createSession,
  createUser,
  deleteSession,
  findUserByEmail,
  getGeneration,
  getUserBySessionTokenHash,
  initializeDatabase,
  listGenerations,
  saveGeneration
} from "./db/database.js";
import { templates } from "./templates/templates.js";
import type { BusinessIntake, GeneratedSite, UserAccount } from "./types.js";

dotenv.config();
initializeDatabase();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:4200" }));
app.use(express.json({ limit: "2mb" }));
app.use((request, response, next) => {
  const startedAt = Date.now();
  response.on("finish", () => {
    console.log(`${request.method} ${request.originalUrl} ${response.statusCode} ${Date.now() - startedAt}ms`);
  });
  next();
});

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
  sections: z
    .array(z.enum(["hero", "about", "services", "products", "menu", "gallery", "testimonials", "contact"]))
    .min(2),
  offerings: z.array(z.string().min(1)).min(1),
  contactEmail: z.string().email(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  socialLinks: z.string().optional()
});

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const hashToken = (token: string) => scryptSync(token, "pixora-session-token", 32).toString("hex");

const hashPassword = (password: string, salt = randomBytes(16).toString("hex")) => {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password: string, storedHash: string) => {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const attempted = scryptSync(password, salt, 64);
  const saved = Buffer.from(hash, "hex");
  return saved.length === attempted.length && timingSafeEqual(saved, attempted);
};

const issueSession = (user: UserAccount) => {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  createSession({ tokenHash: hashToken(token), userId: user.id, expiresAt });
  return { token, user };
};

const getBearerToken = (request: express.Request) => {
  const header = request.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
};

const requireUser = (request: express.Request, response: express.Response, next: express.NextFunction) => {
  const token = getBearerToken(request);
  const user = token ? getUserBySessionTokenHash(hashToken(token)) : null;
  if (!user) {
    response.status(401).json({ message: "Sign in to continue." });
    return;
  }
  response.locals.user = user;
  next();
};

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "pixora-api" }));

app.get("/api/templates", (_req, res) => res.json({ templates }));

app.post("/api/auth/signup", (request, response, next) => {
  try {
    const input = signupSchema.parse(request.body);
    if (findUserByEmail(input.email)) {
      response.status(409).json({ message: "An account already exists for this email." });
      return;
    }
    const user: UserAccount = {
      id: randomUUID(),
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      createdAt: new Date().toISOString()
    };
    createUser({ ...user, passwordHash: hashPassword(input.password) });
    response.status(201).json(issueSession(user));
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    const row = findUserByEmail(input.email);
    if (!row || !verifyPassword(input.password, row.password_hash)) {
      response.status(401).json({ message: "Email or password is incorrect." });
      return;
    }
    response.json(issueSession({ id: row.id, name: row.name, email: row.email, createdAt: row.created_at }));
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireUser, (_req, res) => res.json({ user: res.locals.user }));

app.post("/api/auth/logout", requireUser, (request, response) => {
  deleteSession(hashToken(getBearerToken(request)));
  response.status(204).send();
});

app.get("/api/generations", requireUser, (_req, res) => {
  res.json({ generations: listGenerations(res.locals.user.id) });
});

app.get("/api/generations/:id", requireUser, (request, response) => {
  const site = getGeneration(response.locals.user.id, request.params.id);
  if (!site) {
    response.status(404).json({ message: "Generation not found." });
    return;
  }
  response.json(site);
});

// Generate only — does NOT save. Client decides whether to save.
app.post("/api/generate", requireUser, async (request, response, next) => {
  try {
    const intake = intakeSchema.parse(request.body);
    console.log(`Generating site for "${intake.businessName}" (${intake.businessType})`);
    const site = await runGenerationGraph(intake);
    console.log(`Generated ${site.templateId} site ${site.id}`);
    response.json(site);
  } catch (error) {
    next(error);
  }
});

// Explicit save — called only when user clicks "Save to library"
app.post("/api/generations", requireUser, (request, response, next) => {
  try {
    const { intake, site } = request.body as { intake: BusinessIntake; site: GeneratedSite };
    if (!intake || !site || !site.id || !site.templateId) {
      response.status(400).json({ message: "Invalid save request." });
      return;
    }
    saveGeneration(response.locals.user.id, intake, site);
    console.log(`Saved site ${site.id} for user ${(response.locals.user as UserAccount).id}`);
    response.status(201).json({ saved: true, id: site.id });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    res.status(400).json({ message: "Invalid intake data", issues: error.issues });
    return;
  }
  console.error(error);
  res.status(500).json({ message: "Unexpected server error." });
});

const server = app.listen(port, () => {
  console.log(`Pixora API listening on http://localhost:${port}`);
});

server.on("error", (error) => {
  console.error("Failed to start Pixora API", error);
  process.exit(1);
});
