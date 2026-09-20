import { type Database, db } from "../db/index.js";
import { links } from "../db/schema.js";

export interface LinkRecord {
  code: string;
  targetUrl: string;
}

export interface LinkRepository {
  insert(input: LinkRecord): Promise<LinkRecord | null>;
}

export function createLinkRepository(database: Database = db): LinkRepository {
  return {
    async insert(input) {
      const [createdLink] = await database
        .insert(links)
        .values(input)
        .onConflictDoNothing({ target: links.code })
        .returning({
          code: links.code,
          targetUrl: links.targetUrl,
        });

      return createdLink ?? null;
    },
  };
}
