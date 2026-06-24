import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import { config as loadEnv } from "dotenv";
loadEnv({ path: process.env.NODE_ENV === "production" ? ".env" : ".env.local" });
import express from "express";
import multer from "multer";
import { OAuth2Client } from "google-auth-library";
import Stripe from "stripe";
import { z } from "zod";
import { extractIntakeFromFile } from "./ai/extractionService.js";
import { runGenerationGraph } from "./ai/generationGraph.js";
import { creditPackages, findCreditPackage } from "./billing/creditPackages.js";
import {
  completeCreditPurchase,
  createGoogleUser,
  createSession,
  createUser,
  createVerificationToken,
  addCredits,
  consumeCredits,
  deleteAnyGeneration,
  deleteGeneration,
  deleteSession,
  deleteVerificationToken,
  deleteVerificationTokensForUser,
  deleteUserById,
  findUserByEmail,
  findUserByGoogleId,
  getAdminStats,
  getGeneration,
  getGenerationSummary,
  getPublicGenerationByCustomDomain,
  getPublicGenerationBySlug,
  getUserBySessionTokenHash,
  getUsedTemplateIds,
  getVerificationToken,
  INITIAL_USER_CREDITS,
  initializeDatabase,
  linkGoogleId,
  listAdminGenerations,
  listAdminUsers,
  listGenerations,
  markEmailVerified,
  markUserAdmin,
  saveGeneration,
  setUserCredits,
  updateGenerationDeployment,
  updateUserAdminFlags,
  WEBSITE_GENERATION_CREDITS
} from "./db/database.js";
import { sendVerificationEmail } from "./email/mailer.js";
import { CloudflareRegistrarError, deployToCloudflarePages, findDomainSuggestion, pagesProjectName, searchDomains } from "./domains/domainService.js";
import { templates } from "./templates/templates.js";
import type { BusinessIntake, GeneratedSite, UserAccount } from "./types.js";

initializeDatabase();

const app = express();
const port = Number(process.env.PORT ?? 3000);
const siteDomain = process.env.SITE_DOMAIN ?? "localhost";
const isLocalDomain = siteDomain === "localhost" || siteDomain.endsWith(".localhost");
const publicSiteMode = process.env.PUBLIC_SITE_MODE === "subdomain" ? "subdomain" : "path";
const isProduction = process.env.NODE_ENV === "production";
const clientOrigins = (process.env.CLIENT_ORIGINS ?? process.env.CLIENT_ORIGIN ?? "http://localhost:4200")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
const clientOrigin = clientOrigins[0] ?? "http://localhost:4200";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const isValidStripeSecretKey = stripeSecretKey.startsWith("sk_test_") || stripeSecretKey.startsWith("sk_live_");
const stripe = isValidStripeSecretKey ? new Stripe(stripeSecretKey) : null;
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || clientOrigins.includes(origin.replace(/\/$/, ""))) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin not allowed."));
    }
  })
);

app.use((_request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Frame-Options", "SAMEORIGIN");
  if (isProduction) {
    response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.post("/api/billing/webhook", express.raw({ type: "application/json" }), (request, response) => {
  if (stripeSecretKey && !isValidStripeSecretKey) {
    response.status(501).json({ message: "Stripe secret key must start with sk_test_ or sk_live_." });
    return;
  }
  if (!stripe || !stripeWebhookSecret) {
    response.status(501).json({ message: "Stripe webhooks are not configured." });
    return;
  }

  const signature = request.headers["stripe-signature"];
  if (typeof signature !== "string") {
    response.status(400).json({ message: "Missing Stripe signature." });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(request.body, signature, stripeWebhookSecret);
  } catch (error) {
    response.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : "Invalid signature"}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.type === "domain-registration") {
      // Fire-and-forget: deploy failure must not return a non-200 to Stripe
      handleDomainRegistrationSession(session).catch((err) =>
        console.error("Domain registration webhook error:", err)
      );
    } else {
      const result = applyPaidCreditCheckoutSession(session);
      if (!result.ok) {
        response.status(result.status).json({ message: result.message });
        return;
      }
    }
  }

  response.json({ received: true });
});

app.use(express.json({ limit: "2mb" }));
app.use((request, response, next) => {
  const startedAt = Date.now();
  response.on("finish", () => {
    console.log(`${request.method} ${request.originalUrl} ${response.statusCode} ${Date.now() - startedAt}ms`);
  });
  next();
});

// ─── Schemas ─────────────────────────────────────────────────────────────────

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

const adminUserUpdateSchema = z.object({
  emailVerified: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
  credits: z.number().int().min(0).optional()
});

const checkoutSchema = z.object({
  packageId: z.string().min(1)
});

const checkoutSyncSchema = z.object({
  sessionId: z.string().min(1)
});

const deploymentSchema = z.object({
  publishSlug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9 -]*[a-zA-Z0-9]$/, "Use letters, numbers, spaces, or hyphens.")
    .optional(),
  customDomain: z
    .string()
    .trim()
    .max(253)
    .regex(/^$|^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i, "Enter a valid domain, like example.com.")
    .optional(),
  hostingProvider: z.enum(["pixora-local", "vercel", "netlify", "cloudflare-pages", "self-hosted"]).optional()
});

const domainSearchSchema = z.object({
  query: z.string().trim().min(2).max(80)
});

const domainCheckoutSchema = z.object({
  domain: z.string().trim().min(4).max(253),
  generationId: z.string().min(1),
  years: z.number().int().min(1).max(10),
  autoRenew: z.boolean()
});

const existingDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(4)
    .max(253)
    .transform((value) =>
      value
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "")
        .replace(/\.$/, "")
    )
    .refine((value) => !value.endsWith(".localhost"), "Use a real domain, not a localhost address.")
    .refine((value) => /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(value), "Enter a valid domain, like example.com.")
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────

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

const isAdminEmail = (email: string) => adminEmails.has(email.trim().toLowerCase());

const applyEnvAdminRole = (user: UserAccount): UserAccount => {
  if (!isAdminEmail(user.email)) return user;
  if (!user.isAdmin) {
    markUserAdmin(user.id);
  }
  return { ...user, emailVerified: true, isAdmin: true };
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
  response.locals.user = applyEnvAdminRole(user);
  next();
};

const requireVerifiedUser = (_request: express.Request, response: express.Response, next: express.NextFunction) => {
  const user = response.locals.user as UserAccount | undefined;
  if (!user?.emailVerified) {
    response.status(403).json({ message: "Verify your email address before using Pixora." });
    return;
  }
  next();
};

const requireAdmin = (_request: express.Request, response: express.Response, next: express.NextFunction) => {
  const user = response.locals.user as UserAccount | undefined;
  if (!user?.isAdmin) {
    response.status(403).json({ message: "Admin access required." });
    return;
  }
  next();
};

const applyPaidCreditCheckoutSession = (session: Stripe.Checkout.Session, expectedUserId?: string) => {
  if (session.payment_status !== "paid") {
    return {
      ok: true as const,
      applied: false,
      credits: null,
      message: `Checkout session is ${session.payment_status}.`
    };
  }

  const packageId = session.metadata?.packageId ?? "";
  const userId = session.metadata?.userId ?? "";
  const pack = findCreditPackage(packageId);
  const credits = Number(session.metadata?.credits);
  const amountPaid = session.amount_total ?? 0;
  const currency = (session.currency ?? "").toLowerCase();

  if (expectedUserId && userId !== expectedUserId) {
    return { ok: false as const, status: 403, message: "This checkout session belongs to a different user." };
  }
  if (!pack || !userId || !Number.isInteger(credits) || credits <= 0) {
    return { ok: false as const, status: 400, message: "Checkout session is missing credit metadata." };
  }
  if (credits !== pack.credits || amountPaid !== pack.amountCents || currency !== pack.currency) {
    return { ok: false as const, status: 400, message: "Checkout session does not match a Pixora credit package." };
  }

  const newCredits = completeCreditPurchase({
    stripeSessionId: session.id,
    userId,
    packageId,
    credits,
    amountCents: amountPaid,
    currency,
    status: "completed"
  });

  if (newCredits === null) {
    return { ok: false as const, status: 400, message: "Could not apply credits for this checkout session." };
  }

  return { ok: true as const, applied: true, credits: newCredits, message: "Credits applied." };
};

const handleDomainRegistrationSession = async (session: Stripe.Checkout.Session) => {
  if (session.payment_status !== "paid") return;
  const userId = session.metadata?.userId ?? "";
  const generationId = session.metadata?.generationId ?? "";
  const domain = session.metadata?.domain ?? "";
  if (!userId || !generationId || !domain) return;
  const generation = getGeneration(userId, generationId);
  if (!generation) {
    console.error(`Domain webhook: generation ${generationId} not found for user ${userId}`);
    return;
  }
  const { pagesUrl } = await deployToCloudflarePages(generationId, generation.site.previewHtml, domain);
  updateGenerationDeployment(userId, generationId, { customDomain: domain, hostingProvider: "cloudflare-pages" });
  console.log(`Deployed ${generationId} to Cloudflare Pages (${pagesUrl}), domain: ${domain}`);
};

const getRequestOrigin = (request: express.Request) => {
  if (process.env.PUBLIC_SITE_ORIGIN) return process.env.PUBLIC_SITE_ORIGIN.replace(/\/$/, "");
  if (process.env.SERVER_URL) return process.env.SERVER_URL.replace(/\/$/, "");
  if (["localhost", "127.0.0.1", "::1"].includes(request.hostname)) return `http://localhost:${port}`;
  return `${request.protocol}://${request.get("host")}`;
};

const buildSubdomainUrl = (generation: NonNullable<ReturnType<typeof getGenerationSummary>>) => {
  const siteProtocol = isLocalDomain ? "http" : "https";
  const defaultPort = isLocalDomain ? 80 : 443;
  const sitePort = port !== defaultPort ? `:${port}` : "";
  return `${siteProtocol}://${generation.publishSlug}.${siteDomain}${sitePort}`;
};

const buildPublicUrl = (
  request: express.Request,
  generation: NonNullable<ReturnType<typeof getGenerationSummary>>
) => {
  if (publicSiteMode === "subdomain") {
    return buildSubdomainUrl(generation);
  }
  return `${getRequestOrigin(request)}/${generation.publishSlug}`;
};

const buildDeploymentResponse = (request: express.Request, generation: NonNullable<ReturnType<typeof getGenerationSummary>>) => {
  const customDomainUrl = generation.customDomain ? `https://${generation.customDomain}` : null;
  const publicUrl = buildPublicUrl(request, generation);
  const hostActions: Record<typeof generation.hostingProvider, { label: string; url: string }> = {
    "pixora-local": { label: isProduction ? "Open Pixora site" : "Open local Pixora site", url: publicUrl },
    vercel: { label: "Continue to Vercel", url: "https://vercel.com/new" },
    netlify: { label: "Continue to Netlify", url: "https://app.netlify.com/drop" },
    "cloudflare-pages": {
      label: isLocalDomain || !isProduction ? "Open Pixora site" : "Open on Cloudflare Pages",
      url: isLocalDomain || !isProduction ? publicUrl : `https://${pagesProjectName(generation.id)}.pages.dev`
    },
    "self-hosted": { label: "Open published HTML", url: publicUrl }
  };
  const action = hostActions[generation.hostingProvider] ?? hostActions["pixora-local"];
  return {
    ...generation,
    publicUrl,
    customDomainUrl,
    hostActionLabel: action.label,
    hostActionUrl: action.url
  };
};

const publicHtml = (site: GeneratedSite) => site.previewHtml;

const dnsNameForDomain = (domain: string) => {
  const parts = domain.split(".");
  return parts.length > 2 ? parts.slice(0, -2).join(".") : "@";
};

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "pixora-api" }));

app.get("/api/templates", (_req, res) => res.json({ templates }));

app.get("/api/config", (_req, res) => {
  res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID ?? null });
});

// Signup
app.post("/api/auth/signup", async (request, response, next) => {
  try {
    const input = signupSchema.parse(request.body);
    if (findUserByEmail(input.email)) {
      response.status(409).json({ message: "An account already exists for this email." });
      return;
    }
    const isAdmin = isAdminEmail(input.email);
    const user: UserAccount = {
      id: randomUUID(),
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      createdAt: new Date().toISOString(),
      emailVerified: isAdmin,
      isAdmin,
      credits: INITIAL_USER_CREDITS
    };
    createUser({ ...user, passwordHash: hashPassword(input.password), emailVerified: isAdmin, isAdmin });

    // Send verification email (non-blocking — don't fail signup on SMTP error)
    if (!isAdmin) {
      const verificationToken = randomBytes(32).toString("hex");
      createVerificationToken(user.id, verificationToken);
      sendVerificationEmail(user.email, user.name, verificationToken).catch((err) =>
        console.error("Failed to send verification email:", err)
      );
    }

    response.status(201).json(issueSession(user));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("DOMAIN_ALREADY_CONNECTED:")) {
      response.status(409).json({ message: `${error.message.split(":")[1]} is already connected to another website.` });
      return;
    }
    next(error);
  }
});

// Login
app.post("/api/auth/login", (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    const row = findUserByEmail(input.email);
    if (!row || !verifyPassword(input.password, row.password_hash)) {
      response.status(401).json({ message: "Email or password is incorrect." });
      return;
    }
    const isAdmin = row.is_admin === 1 || isAdminEmail(row.email);
    if (isAdmin && row.is_admin !== 1) {
      markUserAdmin(row.id);
    }
    const user: UserAccount = {
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.created_at,
      emailVerified: isAdmin || row.email_verified === 1,
      isAdmin,
      credits: row.credits
    };
    response.json(issueSession(user));
  } catch (error) {
    next(error);
  }
});

// Email verification click (link from email)
app.get("/api/auth/verify-email", (request, response) => {
  const token = String(request.query.token ?? "");
  if (!token) {
    response.redirect(`${clientOrigin}?verified=invalid`);
    return;
  }
  const record = getVerificationToken(token);
  if (!record || new Date(record.expiresAt) < new Date()) {
    deleteVerificationToken(token);
    response.redirect(`${clientOrigin}?verified=expired`);
    return;
  }
  markEmailVerified(record.userId);
  deleteVerificationToken(token);
  response.redirect(`${clientOrigin}?verified=1`);
});

// Resend verification email
app.post("/api/auth/resend-verification", requireUser, async (request, response, next) => {
  try {
    const user = response.locals.user as UserAccount;
    if (user.emailVerified) {
      response.json({ sent: false, message: "Email is already verified." });
      return;
    }
    deleteVerificationTokensForUser(user.id);
    const token = randomBytes(32).toString("hex");
    createVerificationToken(user.id, token);
    await sendVerificationEmail(user.email, user.name, token);
    response.json({ sent: true });
  } catch (error) {
    next(error);
  }
});

// Google OAuth
app.post("/api/auth/google", async (request, response, next) => {
  try {
    const { credential } = request.body as { credential?: string };
    if (!credential) {
      response.status(400).json({ message: "Missing credential." });
      return;
    }
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      response.status(501).json({ message: "Google Sign-In is not configured." });
      return;
    }
    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      response.status(401).json({ message: "Invalid Google token." });
      return;
    }

    // Find by google_id first, then fall back to email
    let row = findUserByGoogleId(payload.sub);
    if (!row) {
      row = findUserByEmail(payload.email);
      if (row) {
        linkGoogleId(row.id, payload.sub);
      }
    }

    let user: UserAccount;
    if (row) {
      const isAdmin = row.is_admin === 1 || isAdminEmail(row.email);
      user = { id: row.id, name: row.name, email: row.email, createdAt: row.created_at, emailVerified: true, isAdmin, credits: row.credits };
      if (row.email_verified !== 1) {
        markEmailVerified(row.id);
        deleteVerificationTokensForUser(row.id);
      }
      if (isAdmin && row.is_admin !== 1) {
        markUserAdmin(row.id);
      }
    } else {
      const isAdmin = isAdminEmail(payload.email);
      user = {
        id: randomUUID(),
        name: payload.name ?? payload.email.split("@")[0],
        email: payload.email.toLowerCase(),
        createdAt: new Date().toISOString(),
        emailVerified: true,
        isAdmin,
        credits: INITIAL_USER_CREDITS
      };
      createGoogleUser({ id: user.id, name: user.name, email: user.email, googleId: payload.sub, isAdmin });
    }

    response.json(issueSession(user));
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireUser, (_req, res) => res.json({ user: res.locals.user }));

app.post("/api/auth/logout", requireUser, (request, response) => {
  deleteSession(hashToken(getBearerToken(request)));
  response.status(204).send();
});

app.get("/api/billing/credit-packages", requireUser, requireVerifiedUser, (_request, response) => {
  response.json({ packages: creditPackages });
});

// Connect a domain the user already owns — no purchase needed
app.post("/api/generations/:id/connect-domain", requireUser, requireVerifiedUser, async (request, response, next) => {
  try {
    const user = response.locals.user as UserAccount;
    const generationId = String(request.params.id);
    const { domain } = existingDomainSchema.parse(request.body);
    const generation = getGeneration(user.id, generationId);
    if (!generation) {
      response.status(404).json({ message: "Generation not found. Publish it first." });
      return;
    }
    const updatedSummary = updateGenerationDeployment(user.id, generationId, {
      customDomain: domain,
      hostingProvider: "cloudflare-pages"
    });
    const { pagesUrl } = await deployToCloudflarePages(generationId, generation.site.previewHtml, domain);
    const projectName = pagesProjectName(generationId);
    response.json({
      connected: true,
      domain,
      pagesUrl,
      cname: `${projectName}.pages.dev`,
      dnsName: dnsNameForDomain(domain),
      deployment: updatedSummary ? buildDeploymentResponse(request, updatedSummary) : null
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/domains/search", requireUser, requireVerifiedUser, async (request, response, next) => {
  try {
    const input = domainSearchSchema.parse(request.body);
    response.json({ suggestions: await searchDomains(input.query) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/domains/checkout", requireUser, requireVerifiedUser, async (request, response, next) => {
  try {
    if (stripeSecretKey && !isValidStripeSecretKey) {
      response.status(501).json({ message: "Stripe secret key must start with sk_test_ or sk_live_." });
      return;
    }
    if (!stripe) {
      response.status(501).json({ message: "Domain checkout needs Stripe configured first." });
      return;
    }

    const user = response.locals.user as UserAccount;
    const input = domainCheckoutSchema.parse(request.body);
    const generation = getGenerationSummary(user.id, input.generationId);
    if (!generation) {
      response.status(404).json({ message: "Save a website before buying a domain for it." });
      return;
    }

    const domain = await findDomainSuggestion(input.domain);
    if (!domain.available) {
      response.status(409).json({ message: `${domain.domain} is not available.` });
      return;
    }

    const amount = domain.priceCents + Math.max(0, input.years - 1) * domain.renewalPriceCents;
    const successUrl =
      process.env.DOMAIN_SUCCESS_URL ??
      `${clientOrigin}?domain_checkout=success&session_id={CHECKOUT_SESSION_ID}&domain=${encodeURIComponent(domain.domain)}`;
    const cancelUrl = process.env.DOMAIN_CANCEL_URL ?? `${clientOrigin}?domain_checkout=cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      client_reference_id: user.id,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price_data: {
            currency: domain.currency,
            unit_amount: amount,
            product_data: {
              name: `Pixora domain: ${domain.domain}`,
              description: `${input.years} year registration${input.autoRenew ? " with auto-renew enabled" : ""}`
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        type: "domain-registration",
        userId: user.id,
        generationId: generation.id,
        domain: domain.domain,
        years: String(input.years),
        autoRenew: String(input.autoRenew),
        registrar: domain.registrar
      }
    });

    if (!session.url) {
      response.status(502).json({ message: "Stripe did not return a checkout URL." });
      return;
    }

    response.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

app.post("/api/domains/checkout/sync", requireUser, requireVerifiedUser, async (request, response, next) => {
  try {
    if (!stripe) {
      response.status(501).json({ message: "Stripe is not configured." });
      return;
    }
    const { sessionId } = request.body as { sessionId?: string };
    if (!sessionId) {
      response.status(400).json({ message: "Missing sessionId." });
      return;
    }
    const user = response.locals.user as UserAccount;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userId !== user.id) {
      response.status(403).json({ message: "This checkout session belongs to a different user." });
      return;
    }
    if (session.payment_status !== "paid") {
      response.json({ deployed: false, status: session.payment_status });
      return;
    }
    const generationId = session.metadata?.generationId ?? "";
    const domain = session.metadata?.domain ?? "";
    if (!generationId || !domain) {
      response.status(400).json({ message: "Checkout session is missing deployment metadata." });
      return;
    }
    // Idempotent: if already deployed to this domain, return existing deployment
    const existing = getGenerationSummary(user.id, generationId);
    if (existing?.hostingProvider === "cloudflare-pages" && existing.customDomain === domain) {
      response.json({
        deployed: true,
        pagesUrl: `https://${pagesProjectName(generationId)}.pages.dev`,
        domain,
        deployment: buildDeploymentResponse(request, existing)
      });
      return;
    }
    const generation = getGeneration(user.id, generationId);
    if (!generation) {
      response.status(404).json({ message: "Generation not found." });
      return;
    }
    const { pagesUrl } = await deployToCloudflarePages(generationId, generation.site.previewHtml, domain);
    updateGenerationDeployment(user.id, generationId, { customDomain: domain, hostingProvider: "cloudflare-pages" });
    const summary = getGenerationSummary(user.id, generationId);
    response.json({
      deployed: true,
      pagesUrl,
      domain,
      deployment: summary ? buildDeploymentResponse(request, summary) : null
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/billing/checkout", requireUser, requireVerifiedUser, async (request, response, next) => {
  try {
    if (stripeSecretKey && !isValidStripeSecretKey) {
      response.status(501).json({ message: "Stripe secret key must start with sk_test_ or sk_live_." });
      return;
    }
    if (!stripe) {
      response.status(501).json({ message: "Stripe is not configured yet. Add STRIPE_SECRET_KEY on the server." });
      return;
    }

    const user = response.locals.user as UserAccount;
    if (user.isAdmin) {
      response.status(400).json({ message: "Admin accounts already have unlimited generation credits." });
      return;
    }

    const input = checkoutSchema.parse(request.body);
    const pack = findCreditPackage(input.packageId);
    if (!pack) {
      response.status(404).json({ message: "Credit package not found." });
      return;
    }

    const successUrl =
      process.env.STRIPE_SUCCESS_URL ?? `${clientOrigin}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = process.env.STRIPE_CANCEL_URL ?? `${clientOrigin}?checkout=cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      client_reference_id: user.id,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price_data: {
            currency: pack.currency,
            unit_amount: pack.amountCents,
            product_data: {
              name: `Pixora ${pack.name}`,
              description: `${pack.credits} credits`
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        userId: user.id,
        packageId: pack.id,
        credits: String(pack.credits)
      },
      payment_intent_data: {
        metadata: {
          userId: user.id,
          packageId: pack.id,
          credits: String(pack.credits)
        }
      }
    });

    if (!session.url) {
      response.status(502).json({ message: "Stripe did not return a checkout URL." });
      return;
    }

    response.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

app.post("/api/billing/checkout/sync", requireUser, requireVerifiedUser, async (request, response, next) => {
  try {
    if (stripeSecretKey && !isValidStripeSecretKey) {
      response.status(501).json({ message: "Stripe secret key must start with sk_test_ or sk_live_." });
      return;
    }
    if (!stripe) {
      response.status(501).json({ message: "Stripe is not configured yet. Add STRIPE_SECRET_KEY on the server." });
      return;
    }

    const user = response.locals.user as UserAccount;
    if (user.isAdmin) {
      response.status(400).json({ message: "Admin accounts already have unlimited generation credits." });
      return;
    }

    const input = checkoutSyncSchema.parse(request.body);
    const session = await stripe.checkout.sessions.retrieve(input.sessionId);
    const result = applyPaidCreditCheckoutSession(session, user.id);

    if (!result.ok) {
      response.status(result.status).json({ message: result.message });
      return;
    }

    response.json({
      applied: result.applied,
      credits: result.credits,
      status: session.payment_status,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/overview", requireUser, requireVerifiedUser, requireAdmin, (_req, res) => {
  res.json({
    stats: getAdminStats(),
    users: listAdminUsers(),
    generations: listAdminGenerations()
  });
});

app.get("/api/admin/users/:id/generations", requireUser, requireVerifiedUser, requireAdmin, (request, response) => {
  response.json({ generations: listAdminGenerations(String(request.params.id)) });
});

app.patch("/api/admin/users/:id", requireUser, requireVerifiedUser, requireAdmin, (request, response, next) => {
  try {
    const targetUserId = String(request.params.id);
    const currentUser = response.locals.user as UserAccount;
    const input = adminUserUpdateSchema.parse(request.body);
    if (targetUserId === currentUser.id && input.isAdmin === false) {
      response.status(400).json({ message: "You cannot remove your own admin access." });
      return;
    }
    const flagsUpdated = updateUserAdminFlags(targetUserId, input);
    const creditsUpdated = typeof input.credits === "number" ? setUserCredits(targetUserId, input.credits) : false;
    const updated = flagsUpdated || creditsUpdated;
    if (!updated) {
      response.status(404).json({ message: "User not found or no changes requested." });
      return;
    }
    response.json({ updated: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/users/:id", requireUser, requireVerifiedUser, requireAdmin, (request, response) => {
  const targetUserId = String(request.params.id);
  const currentUser = response.locals.user as UserAccount;
  if (targetUserId === currentUser.id) {
    response.status(400).json({ message: "You cannot delete your own admin account." });
    return;
  }
  const deleted = deleteUserById(targetUserId);
  if (!deleted) {
    response.status(404).json({ message: "User not found." });
    return;
  }
  response.status(204).send();
});

app.delete("/api/admin/generations/:id", requireUser, requireVerifiedUser, requireAdmin, (request, response) => {
  const deleted = deleteAnyGeneration(String(request.params.id));
  if (!deleted) {
    response.status(404).json({ message: "Generation not found." });
    return;
  }
  response.status(204).send();
});

app.get("/api/generations", requireUser, requireVerifiedUser, (req, res) => {
  const gens = listGenerations(res.locals.user.id);
  const withUrls = gens.map((g) => ({
    ...g,
    publicUrl: buildPublicUrl(req, g)
  }));
  res.json({ generations: withUrls });
});

app.get("/api/generations/:id", requireUser, requireVerifiedUser, (request, response) => {
  const result = getGeneration(response.locals.user.id, String(request.params.id));
  if (!result) {
    response.status(404).json({ message: "Generation not found." });
    return;
  }
  const summary = getGenerationSummary(response.locals.user.id, String(request.params.id));
  response.json({ ...result, deployment: summary ? buildDeploymentResponse(request, summary) : null });
});

// Generate only — does NOT save. Client decides whether to save.
app.post("/api/generate", requireUser, requireVerifiedUser, async (request, response, next) => {
  let chargedUserId: string | null = null;
  try {
    const intake = intakeSchema.parse(request.body);
    const user = response.locals.user as UserAccount;
    if (!user.isAdmin) {
      const remainingCredits = consumeCredits(user.id, WEBSITE_GENERATION_CREDITS);
      if (remainingCredits === null) {
        response.status(402).json({
          message: `You need ${WEBSITE_GENERATION_CREDITS} credits to generate a website.`,
          requiredCredits: WEBSITE_GENERATION_CREDITS,
          credits: user.credits
        });
        return;
      }
      chargedUserId = user.id;
      user.credits = remainingCredits;
    }
    const usedTemplateIds = getUsedTemplateIds(user.id, intake.businessType);
    console.log(`Generating site for "${intake.businessName}" (${intake.businessType}), avoiding [${usedTemplateIds.join(", ") || "none"}]`);
    const site = await runGenerationGraph(intake, usedTemplateIds);
    console.log(`Generated ${site.templateId} site ${site.id}`);
    response.json({ ...site, credits: user.credits, creditsCharged: user.isAdmin ? 0 : WEBSITE_GENERATION_CREDITS });
  } catch (error) {
    if (chargedUserId) {
      addCredits(chargedUserId, WEBSITE_GENERATION_CREDITS);
    }
    next(error);
  }
});

app.delete("/api/generations/:id", requireUser, requireVerifiedUser, (request, response) => {
  const deleted = deleteGeneration((response.locals.user as UserAccount).id, String(request.params.id));
  if (!deleted) {
    response.status(404).json({ message: "Generation not found." });
    return;
  }
  response.status(204).send();
});

const isCloudflareConfigured = () => !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP images and PDF files are supported."));
  }
});

// Generate from a business card or invoice file (image or PDF)
app.post("/api/generate-from-file", requireUser, requireVerifiedUser, upload.single("file"), async (request, response, next) => {
  let chargedUserId: string | null = null;
  try {
    const user = response.locals.user as UserAccount;
    if (!request.file) {
      response.status(400).json({ message: "No file uploaded." });
      return;
    }
    if (!user.isAdmin) {
      const remainingCredits = consumeCredits(user.id, WEBSITE_GENERATION_CREDITS);
      if (remainingCredits === null) {
        response.status(402).json({
          message: `You need ${WEBSITE_GENERATION_CREDITS} credits to generate a website.`,
          requiredCredits: WEBSITE_GENERATION_CREDITS,
          credits: user.credits
        });
        return;
      }
      chargedUserId = user.id;
      user.credits = remainingCredits;
    }
    const intake = await extractIntakeFromFile(request.file.buffer, request.file.mimetype);
    const usedTemplateIds = getUsedTemplateIds(user.id, intake.businessType);
    console.log(`Generating site from file for "${intake.businessName}" (${intake.businessType})`);
    const site = await runGenerationGraph(intake, usedTemplateIds);
    console.log(`Generated ${site.templateId} site ${site.id} from file`);
    response.json({ ...site, credits: user.credits, creditsCharged: user.isAdmin ? 0 : WEBSITE_GENERATION_CREDITS, extractedIntake: intake });
  } catch (error) {
    if (chargedUserId) addCredits(chargedUserId, WEBSITE_GENERATION_CREDITS);
    next(error);
  }
});

// Save + optionally deploy to Cloudflare Pages (skipped when self-hosting)
app.post("/api/generations", requireUser, requireVerifiedUser, async (request, response, next) => {
  try {
    const { intake, site } = request.body as { intake: BusinessIntake; site: GeneratedSite };
    if (!intake || !site || !site.id || !site.templateId) {
      response.status(400).json({ message: "Invalid save request." });
      return;
    }
    const userId = (response.locals.user as UserAccount).id;
    saveGeneration(userId, intake, site);

    let pagesUrl: string | null = null;
    if (isCloudflareConfigured()) {
      try {
        const result = await deployToCloudflarePages(site.id, site.previewHtml);
        pagesUrl = result.pagesUrl;
        updateGenerationDeployment(userId, site.id, { hostingProvider: "cloudflare-pages" });
      } catch (deployError) {
        console.error("Pages deploy failed (site still saved):", deployError);
      }
    }

    const summary = getGenerationSummary(userId, site.id);
    console.log(`Saved site ${site.id} for user ${userId}${pagesUrl ? ` → ${pagesUrl}` : ""}`);
    response.status(201).json({
      saved: true,
      id: site.id,
      pagesUrl,
      deployment: summary ? buildDeploymentResponse(request, summary) : null
    });
  } catch (error) {
    next(error);
  }
});

// Re-publish an already-saved generation
app.post("/api/generations/:id/publish", requireUser, requireVerifiedUser, async (request, response, next) => {
  try {
    const user = response.locals.user as UserAccount;
    const generationId = String(request.params.id);
    const generation = getGeneration(user.id, generationId);
    if (!generation) {
      response.status(404).json({ message: "Generation not found." });
      return;
    }

    let pagesUrl: string | null = null;
    if (isCloudflareConfigured()) {
      const result = await deployToCloudflarePages(generationId, generation.site.previewHtml);
      pagesUrl = result.pagesUrl;
      updateGenerationDeployment(user.id, generationId, { hostingProvider: "cloudflare-pages" });
      console.log(`Re-published site ${generationId} → ${pagesUrl}`);
    } else {
      updateGenerationDeployment(user.id, generationId, { hostingProvider: "pixora-local" });
      console.log(`Published site ${generationId} locally`);
    }

    const summary = getGenerationSummary(user.id, generationId);
    response.json({
      pagesUrl,
      deployment: summary ? buildDeploymentResponse(request, summary) : null
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/generations/:id/deployment", requireUser, requireVerifiedUser, (request, response, next) => {
  try {
    const input = deploymentSchema.parse(request.body);
    const generation = updateGenerationDeployment((response.locals.user as UserAccount).id, String(request.params.id), {
      publishSlug: input.publishSlug,
      customDomain: input.customDomain,
      hostingProvider: input.hostingProvider
    });
    if (!generation) {
      response.status(404).json({ message: "Generation not found." });
      return;
    }
    response.json({ deployment: buildDeploymentResponse(request, generation) });
  } catch (error) {
    next(error);
  }
});

app.use((request, response, next) => {
  if (request.method !== "GET" || request.path.startsWith("/api")) {
    next();
    return;
  }

  const host = request.hostname.toLowerCase();

  // Subdomain-based hosting: {slug}.{SITE_DOMAIN}
  const escapedSiteDomain = siteDomain.replace(/\./g, "\\.");
  const subdomainMatch = host.match(new RegExp(`^([a-z0-9][a-z0-9-]*)\\.${escapedSiteDomain}$`));
  if (subdomainMatch) {
    const slug = subdomainMatch[1];
    const slugSite = getPublicGenerationBySlug(slug);
    if (slugSite) {
      response.type("html").send(publicHtml(slugSite.site));
      return;
    }
  }

  // Custom domain matching for production (non-localhost, non-SITE_DOMAIN hosts)
  if (host && !["localhost", "127.0.0.1", "::1"].includes(host) && !subdomainMatch) {
    const customDomainSite = getPublicGenerationByCustomDomain(host);
    if (customDomainSite) {
      response.type("html").send(publicHtml(customDomainSite.site));
      return;
    }
  }

  if (/^\/[a-z0-9-]+\/?$/.test(request.path)) {
    const slug = request.path.replace(/^\/|\/$/g, "");
    const slugSite = getPublicGenerationBySlug(slug);
    if (slugSite) {
      response.type("html").send(publicHtml(slugSite.site));
      return;
    }
  }

  next();
});

// Serve Angular build and fall back to index.html for client-side routing
const __serverDir = dirname(fileURLToPath(import.meta.url));
const clientBuildPath = join(__serverDir, "../../client/dist/pixora-client");
if (existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath, { index: false }));
  app.get("/{*splat}", (req, res, next) => {
    if (req.path.startsWith("/api/")) { next(); return; }
    const indexPath = join(clientBuildPath, "index.html");
    if (existsSync(indexPath)) {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    const message = error.issues[0]?.message ?? "Invalid request data.";
    res.status(400).json({ message, issues: error.issues });
    return;
  }
  if (error instanceof CloudflareRegistrarError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (error instanceof multer.MulterError || (error instanceof Error && error.message.includes("supported"))) {
    res.status(400).json({ message: error instanceof Error ? error.message : "File upload error." });
    return;
  }
  console.error(error);
  res.status(500).json({
    message: isProduction ? "Unexpected server error." : error instanceof Error ? error.message : "Unexpected server error."
  });
});

const server = app.listen(port, () => {
  console.log(`Pixora API listening on http://localhost:${port}`);
});

server.on("error", (error) => {
  console.error("Failed to start Pixora API", error);
  process.exit(1);
});
