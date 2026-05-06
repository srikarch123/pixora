import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { OAuth2Client } from "google-auth-library";
import Stripe from "stripe";
import { z } from "zod";
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
  updateUserAdminFlags,
  WEBSITE_GENERATION_CREDITS
} from "./db/database.js";
import { sendVerificationEmail } from "./email/mailer.js";
import { templates } from "./templates/templates.js";
import type { BusinessIntake, GeneratedSite, UserAccount } from "./types.js";

initializeDatabase();

const app = express();
const port = Number(process.env.PORT ?? 3000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:4200";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

app.use(cors({ origin: clientOrigin }));

app.post("/api/billing/webhook", express.raw({ type: "application/json" }), (request, response) => {
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
    const session = event.data.object;
    if (session.payment_status === "paid") {
      const packageId = session.metadata?.packageId ?? "";
      const userId = session.metadata?.userId ?? "";
      const pack = findCreditPackage(packageId);
      const credits = Number(session.metadata?.credits);
      const amountPaid = session.amount_total ?? 0;
      const currency = (session.currency ?? "").toLowerCase();

      if (!pack || !userId || !Number.isInteger(credits) || credits <= 0) {
        response.status(400).json({ message: "Checkout session is missing credit metadata." });
        return;
      }
      if (credits !== pack.credits || amountPaid !== pack.amountCents || currency !== pack.currency) {
        response.status(400).json({ message: "Checkout session does not match a Pixora credit package." });
        return;
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
        response.status(400).json({ message: "Could not apply credits for this checkout session." });
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

app.post("/api/billing/checkout", requireUser, requireVerifiedUser, async (request, response, next) => {
  try {
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

app.get("/api/generations", requireUser, requireVerifiedUser, (_req, res) => {
  res.json({ generations: listGenerations(res.locals.user.id) });
});

app.get("/api/generations/:id", requireUser, requireVerifiedUser, (request, response) => {
  const site = getGeneration(response.locals.user.id, String(request.params.id));
  if (!site) {
    response.status(404).json({ message: "Generation not found." });
    return;
  }
  response.json(site);
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

// Explicit save — called only when user clicks "Save to library"
app.post("/api/generations", requireUser, requireVerifiedUser, (request, response, next) => {
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
