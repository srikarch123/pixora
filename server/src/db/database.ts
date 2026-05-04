import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import type { BusinessIntake, GeneratedSite, GenerationSummary, UserAccount } from "../types.js";

const databasePath = process.env.DATABASE_URL?.replace("sqlite:", "") ?? join(process.cwd(), "data", "pixora.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

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

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
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
    // Table exists — migrate older or nullable user_id schemas to NOT NULL if needed
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
      // Orphan any generations with no user, reassign to the first user if only one exists
      const users = db.prepare("SELECT id FROM users ORDER BY created_at ASC LIMIT 1").all() as Array<{ id: string }>;
      if (users.length === 1) {
        db.prepare("UPDATE generations SET user_id = ? WHERE user_id IS NULL").run(users[0].id);
      }
      // Drop rows that still have no owner
      db.exec("DELETE FROM generations WHERE user_id IS NULL");

      // Rebuild the table with NOT NULL enforced
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
};

export const createUser = (user: { id: string; name: string; email: string; passwordHash: string }) => {
  db.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)").run(
    user.id,
    user.name,
    user.email.toLowerCase(),
    user.passwordHash
  );
};

export const findUserByEmail = (email: string) =>
  db.prepare("SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?").get(email.toLowerCase()) as
    | { id: string; name: string; email: string; password_hash: string; created_at: string }
    | undefined;

export const getUserBySessionTokenHash = (tokenHash: string): UserAccount | null => {
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP`
    )
    .get(tokenHash) as { id: string; name: string; email: string; created_at: string } | undefined;

  return row ? { id: row.id, name: row.name, email: row.email, createdAt: row.created_at } : null;
};

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
