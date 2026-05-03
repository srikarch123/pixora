import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { BusinessIntake, GeneratedSite } from "../types.js";

const databasePath = process.env.DATABASE_URL?.replace("sqlite:", "") ?? join(process.cwd(), "data", "pixora.sqlite");

mkdirSync(dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);

export const initializeDatabase = () => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      business_type TEXT NOT NULL,
      template_id TEXT NOT NULL,
      intake_json TEXT NOT NULL,
      generated_site_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_generations_business_type
      ON generations (business_type);

    CREATE INDEX IF NOT EXISTS idx_generations_created_at
      ON generations (created_at);
  `);
};

export const saveGeneration = (intake: BusinessIntake, site: GeneratedSite) => {
  database
    .prepare(
      `INSERT INTO generations (
        id,
        business_name,
        business_type,
        template_id,
        intake_json,
        generated_site_json
      ) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      site.id,
      intake.businessName,
      intake.businessType,
      site.templateId,
      JSON.stringify(intake),
      JSON.stringify(site)
    );
};

export const listGenerations = () =>
  database
    .prepare(
      `SELECT id, business_name, business_type, template_id, created_at
       FROM generations
       ORDER BY created_at DESC
       LIMIT 50`
    )
    .all();

export const getGeneration = (id: string): GeneratedSite | null => {
  const row = database
    .prepare("SELECT generated_site_json FROM generations WHERE id = ?")
    .get(id) as { generated_site_json: string } | undefined;

  return row ? (JSON.parse(row.generated_site_json) as GeneratedSite) : null;
};
