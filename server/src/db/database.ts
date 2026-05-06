import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import type {
  AdminGenerationSummary,
  AdminStats,
  AdminUserSummary,
  BusinessIntake,
  CreditPurchase,
  GeneratedSite,
  GenerationSummary,
  UserAccount
} from "../types.js";

const databasePath = process.env.DATABASE_URL?.replace("sqlite:", "") ?? join(process.cwd(), "data", "pixora.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export const INITIAL_USER_CREDITS = 5;
export const WEBSITE_GENERATION_CREDITS = 5;

const colExists = (table: string, col: string) =>
  (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).some((c) => c.name === col);

export const initializeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrate: add email_verified (DEFAULT 1 so existing users are considered verified)
  if (!colExists("users", "email_verified")) {
    db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1");
  }
  // Migrate: add google_id
  if (!colExists("users", "google_id")) {
    db.exec("ALTER TABLE users ADD COLUMN google_id TEXT");
  }
  // Migrate: add is_admin
  if (!colExists("users", "is_admin")) {
    db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0");
  }
  // Migrate: add credits
  if (!colExists("users", "credits")) {
    db.exec(`ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT ${INITIAL_USER_CREDITS}`);
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  for (const email of adminEmails) {
    db.prepare("UPDATE users SET is_admin = 1, email_verified = 1 WHERE email = ?").run(email);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS credit_purchases (
      stripe_session_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      credits INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Determine if generations table needs to be created or migrated
  const tableInfo = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='generations'")
    .get() as { name: string } | undefined;

  if (!tableInfo) {
    db.exec(`
      CREATE TABLE generations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        business_name TEXT NOT NULL,
        business_type TEXT NOT NULL,
        template_id TEXT NOT NULL,
        intake_json TEXT NOT NULL,
        generated_site_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
  } else {
    const cols = db.prepare("PRAGMA table_info(generations)").all() as Array<{
      name: string;
      notnull: number;
    }>;
    let userIdCol = cols.find((c) => c.name === "user_id");

    if (!userIdCol) {
      db.exec("ALTER TABLE generations ADD COLUMN user_id TEXT");
      userIdCol = { name: "user_id", notnull: 0 };
    }

    if (userIdCol && !userIdCol.notnull) {
      const users = db.prepare("SELECT id FROM users ORDER BY created_at ASC LIMIT 1").all() as Array<{ id: string }>;
      if (users.length === 1) {
        db.prepare("UPDATE generations SET user_id = ? WHERE user_id IS NULL").run(users[0].id);
      }
      db.exec("DELETE FROM generations WHERE user_id IS NULL");

      db.pragma("foreign_keys = OFF");
      db.exec(`
        BEGIN;
        CREATE TABLE generations_new (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          business_name TEXT NOT NULL,
          business_type TEXT NOT NULL,
          template_id TEXT NOT NULL,
          intake_json TEXT NOT NULL,
          generated_site_json TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
        INSERT INTO generations_new SELECT id, user_id, business_name, business_type, template_id, intake_json, generated_site_json, created_at FROM generations;
        DROP TABLE generations;
        ALTER TABLE generations_new RENAME TO generations;
        COMMIT;
      `);
      db.pragma("foreign_keys = ON");
    }
  }

  db.exec("CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_generations_user ON generations (user_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_generations_created ON generations (created_at)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_credit_purchases_user ON credit_purchases (user_id)");
};

// ─── User helpers ────────────────────────────────────────────────────────────

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  email_verified: number;
  is_admin: number;
  credits: number;
  google_id: string | null;
  created_at: string;
};

export const createUser = (user: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  emailVerified?: boolean;
  isAdmin?: boolean;
  credits?: number;
}) => {
  db.prepare(
    "INSERT INTO users (id, name, email, password_hash, email_verified, is_admin, credits) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    user.id,
    user.name,
    user.email.toLowerCase(),
    user.passwordHash,
    user.emailVerified ? 1 : 0,
    user.isAdmin ? 1 : 0,
    user.credits ?? INITIAL_USER_CREDITS
  );
};

export const createGoogleUser = (user: { id: string; name: string; email: string; googleId: string; isAdmin?: boolean; credits?: number }) => {
  db.prepare(
    "INSERT INTO users (id, name, email, password_hash, email_verified, google_id, is_admin, credits) VALUES (?, ?, ?, '', 1, ?, ?, ?)"
  ).run(user.id, user.name, user.email.toLowerCase(), user.googleId, user.isAdmin ? 1 : 0, user.credits ?? INITIAL_USER_CREDITS);
};

export const findUserByEmail = (email: string): UserRow | undefined =>
  db
    .prepare("SELECT id, name, email, password_hash, email_verified, is_admin, credits, google_id, created_at FROM users WHERE email = ?")
    .get(email.toLowerCase()) as UserRow | undefined;

export const findUserByGoogleId = (googleId: string): UserRow | undefined =>
  db
    .prepare("SELECT id, name, email, password_hash, email_verified, is_admin, credits, google_id, created_at FROM users WHERE google_id = ?")
    .get(googleId) as UserRow | undefined;

export const linkGoogleId = (userId: string, googleId: string) => {
  db.prepare("UPDATE users SET google_id = ? WHERE id = ?").run(googleId, userId);
};

export const markEmailVerified = (userId: string) => {
  db.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(userId);
};

export const markUserAdmin = (userId: string) => {
  db.prepare("UPDATE users SET is_admin = 1, email_verified = 1 WHERE id = ?").run(userId);
};

export const updateUserAdminFlags = (
  userId: string,
  input: { emailVerified?: boolean; isAdmin?: boolean }
): boolean => {
  const assignments: string[] = [];
  const values: Array<number | string> = [];
  if (typeof input.emailVerified === "boolean") {
    assignments.push("email_verified = ?");
    values.push(input.emailVerified ? 1 : 0);
  }
  if (typeof input.isAdmin === "boolean") {
    assignments.push("is_admin = ?");
    values.push(input.isAdmin ? 1 : 0);
    if (input.isAdmin) {
      assignments.push("email_verified = 1");
    }
  }
  if (!assignments.length) return false;
  values.push(userId);
  const result = db.prepare(`UPDATE users SET ${assignments.join(", ")} WHERE id = ?`).run(...values);
  return result.changes > 0;
};

const rowToUser = (row: UserRow): UserAccount => ({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: row.created_at,
  emailVerified: row.email_verified === 1,
  isAdmin: row.is_admin === 1,
  credits: row.credits
});

export const getUserBySessionTokenHash = (tokenHash: string): UserAccount | null => {
  const row = db
    .prepare(
		      `SELECT u.id, u.name, u.email, u.password_hash, u.email_verified, u.is_admin, u.credits, u.google_id, u.created_at
		       FROM sessions s
	       JOIN users u ON u.id = s.user_id
	       WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP`
    )
    .get(tokenHash) as UserRow | undefined;

  return row ? rowToUser(row) : null;
};

// ─── Session helpers ─────────────────────────────────────────────────────────

export const createSession = (session: { tokenHash: string; userId: string; expiresAt: string }) => {
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(
    session.tokenHash,
    session.userId,
    session.expiresAt
  );
};

export const deleteSession = (tokenHash: string) => {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
};

// ─── Email verification helpers ──────────────────────────────────────────────

export const createVerificationToken = (userId: string, token: string) => {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    "INSERT OR REPLACE INTO email_verification_tokens (token, user_id, expires_at) VALUES (?, ?, ?)"
  ).run(token, userId, expiresAt);
};

export const getVerificationToken = (token: string): { userId: string; expiresAt: string } | undefined => {
  return db
    .prepare("SELECT user_id AS userId, expires_at AS expiresAt FROM email_verification_tokens WHERE token = ?")
    .get(token) as { userId: string; expiresAt: string } | undefined;
};

export const deleteVerificationToken = (token: string) => {
  db.prepare("DELETE FROM email_verification_tokens WHERE token = ?").run(token);
};

export const deleteVerificationTokensForUser = (userId: string) => {
  db.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").run(userId);
};

// ─── Generation helpers ──────────────────────────────────────────────────────

export const saveGeneration = (userId: string, intake: BusinessIntake, site: GeneratedSite) => {
  db.prepare(
    `INSERT INTO generations (id, user_id, business_name, business_type, template_id, intake_json, generated_site_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    site.id,
    userId,
    intake.businessName,
    intake.businessType,
    site.templateId,
    JSON.stringify(intake),
    JSON.stringify(site)
  );
};

export const listGenerations = (userId: string): GenerationSummary[] =>
  (
    db
      .prepare(
        `SELECT id, business_name, business_type, template_id, created_at
         FROM generations
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50`
      )
      .all(userId) as Array<{
      id: string;
      business_name: string;
      business_type: GenerationSummary["businessType"];
      template_id: string;
      created_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    businessName: row.business_name,
    businessType: row.business_type,
    templateId: row.template_id,
    createdAt: row.created_at
  }));

export const getGeneration = (userId: string, id: string): GeneratedSite | null => {
  const row = db
    .prepare("SELECT generated_site_json FROM generations WHERE user_id = ? AND id = ?")
    .get(userId, id) as { generated_site_json: string } | undefined;

  return row ? (JSON.parse(row.generated_site_json) as GeneratedSite) : null;
};

export const getUsedTemplateIds = (userId: string, businessType: string): string[] =>
  (
    db
      .prepare("SELECT template_id FROM generations WHERE user_id = ? AND business_type = ?")
      .all(userId, businessType) as Array<{ template_id: string }>
  ).map((r) => r.template_id);

export const deleteGeneration = (userId: string, id: string): boolean => {
  const result = db.prepare("DELETE FROM generations WHERE user_id = ? AND id = ?").run(userId, id);
  return result.changes > 0;
};

export const consumeCredits = (userId: string, amount: number): number | null => {
  const result = db.prepare("UPDATE users SET credits = credits - ? WHERE id = ? AND credits >= ?").run(amount, userId, amount);
  if (result.changes === 0) return null;
  const row = db.prepare("SELECT credits FROM users WHERE id = ?").get(userId) as { credits: number } | undefined;
  return row?.credits ?? null;
};

export const addCredits = (userId: string, amount: number): number | null => {
  const result = db.prepare("UPDATE users SET credits = MAX(0, credits + ?) WHERE id = ?").run(amount, userId);
  if (result.changes === 0) return null;
  const row = db.prepare("SELECT credits FROM users WHERE id = ?").get(userId) as { credits: number } | undefined;
  return row?.credits ?? null;
};

export const setUserCredits = (userId: string, credits: number): boolean => {
  const result = db.prepare("UPDATE users SET credits = ? WHERE id = ?").run(Math.max(0, credits), userId);
  return result.changes > 0;
};

const completeCreditPurchaseTransaction = db.transaction((purchase: CreditPurchase): number | null => {
  const existing = db
    .prepare("SELECT stripe_session_id FROM credit_purchases WHERE stripe_session_id = ?")
    .get(purchase.stripeSessionId);
  if (existing) {
    const row = db.prepare("SELECT credits FROM users WHERE id = ?").get(purchase.userId) as { credits: number } | undefined;
    return row?.credits ?? null;
  }

  const result = db.prepare("UPDATE users SET credits = credits + ? WHERE id = ?").run(purchase.credits, purchase.userId);
  if (result.changes === 0) return null;

  db.prepare(
    `INSERT INTO credit_purchases (stripe_session_id, user_id, package_id, credits, amount_cents, currency, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    purchase.stripeSessionId,
    purchase.userId,
    purchase.packageId,
    purchase.credits,
    purchase.amountCents,
    purchase.currency,
    purchase.status
  );

  const row = db.prepare("SELECT credits FROM users WHERE id = ?").get(purchase.userId) as { credits: number } | undefined;
  return row?.credits ?? null;
});

export const completeCreditPurchase = (purchase: CreditPurchase): number | null => completeCreditPurchaseTransaction(purchase);

// ─── Admin helpers ────────────────────────────────────────────────────────────

export const getAdminStats = (): AdminStats => {
  const users = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  const verifiedUsers = db.prepare("SELECT COUNT(*) AS count FROM users WHERE email_verified = 1").get() as { count: number };
  const admins = db.prepare("SELECT COUNT(*) AS count FROM users WHERE is_admin = 1").get() as { count: number };
  const generations = db.prepare("SELECT COUNT(*) AS count FROM generations").get() as { count: number };
  const totalCredits = db.prepare("SELECT COALESCE(SUM(credits), 0) AS total FROM users").get() as { total: number };
  return {
    users: users.count,
    verifiedUsers: verifiedUsers.count,
    admins: admins.count,
    generations: generations.count,
    totalCredits: totalCredits.total
  };
};

export const listAdminUsers = (): AdminUserSummary[] =>
  (
    db
      .prepare(
        `SELECT u.id, u.name, u.email, u.email_verified, u.is_admin, u.credits, u.created_at, COUNT(g.id) AS generation_count
         FROM users u
         LEFT JOIN generations g ON g.user_id = u.id
         GROUP BY u.id
         ORDER BY u.created_at DESC`
      )
      .all() as Array<{
      id: string;
      name: string;
      email: string;
      email_verified: number;
      is_admin: number;
      credits: number;
      created_at: string;
      generation_count: number;
    }>
  ).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    emailVerified: row.email_verified === 1,
    isAdmin: row.is_admin === 1,
    credits: row.credits,
    generationCount: row.generation_count
  }));

export const listAdminGenerations = (userId?: string): AdminGenerationSummary[] =>
  (
    db
      .prepare(
        `SELECT g.id, g.user_id, g.business_name, g.business_type, g.template_id, g.created_at, u.email, u.name
         FROM generations g
         JOIN users u ON u.id = g.user_id
         WHERE (? IS NULL OR g.user_id = ?)
         ORDER BY g.created_at DESC
         LIMIT 200`
      )
      .all(userId ?? null, userId ?? null) as Array<{
      id: string;
      user_id: string;
      business_name: string;
      business_type: GenerationSummary["businessType"];
      template_id: string;
      created_at: string;
      email: string;
      name: string;
    }>
  ).map((row) => ({
    id: row.id,
    userId: row.user_id,
    userEmail: row.email,
    userName: row.name,
    businessName: row.business_name,
    businessType: row.business_type,
    templateId: row.template_id,
    createdAt: row.created_at
  }));

export const deleteUserById = (id: string): boolean => {
  const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
  return result.changes > 0;
};

export const deleteAnyGeneration = (id: string): boolean => {
  const result = db.prepare("DELETE FROM generations WHERE id = ?").run(id);
  return result.changes > 0;
};
