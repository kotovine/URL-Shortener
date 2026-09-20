import { randomInt } from "node:crypto";

import type { LinkRecord, LinkRepository } from "./repository.js";
import { SHORT_CODE_LENGTH } from "./schemas.js";

const SHORT_CODE_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const DEFAULT_MAX_ATTEMPTS = 5;

export type GenerateShortCode = () => string;

export interface CreateLinkServiceOptions {
  repository: LinkRepository;
  generateCode?: GenerateShortCode;
  maxAttempts?: number;
}

export class ShortCodeGenerationError extends Error {
  constructor() {
    super("Unable to generate a unique short code.");
    this.name = "ShortCodeGenerationError";
  }
}

export function generateShortCode(): string {
  let code = "";

  for (let index = 0; index < SHORT_CODE_LENGTH; index += 1) {
    code += SHORT_CODE_ALPHABET[randomInt(SHORT_CODE_ALPHABET.length)];
  }

  return code;
}

export function createLinkService({
  repository,
  generateCode = generateShortCode,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
}: CreateLinkServiceOptions) {
  return async function createLink(targetUrl: string): Promise<LinkRecord> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const createdLink = await repository.insert({
        code: generateCode(),
        targetUrl,
      });

      if (createdLink) {
        return createdLink;
      }
    }

    throw new ShortCodeGenerationError();
  };
}

export type CreateLink = ReturnType<typeof createLinkService>;
