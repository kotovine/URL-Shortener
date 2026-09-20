import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "../config.js";
import { links } from "./schema.js";
import * as schema from "./schema.js";

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle({ client: pool, schema });

export async function checkDatabaseConnection(): Promise<void> {
  await db.select({ id: links.id }).from(links).limit(1);
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
