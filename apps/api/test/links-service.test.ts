import { describe, expect, it, vi } from "vitest";

import type { LinkRepository } from "../src/links/repository.js";
import {
  createLinkService,
  generateShortCode,
  ShortCodeGenerationError,
} from "../src/links/service.js";
import { SHORT_CODE_LENGTH, SHORT_CODE_PATTERN } from "../src/links/schemas.js";

describe("generateShortCode", () => {
  it("generates fixed-length alphanumeric codes", () => {
    for (let index = 0; index < 100; index += 1) {
      const code = generateShortCode();

      expect(code).toHaveLength(SHORT_CODE_LENGTH);
      expect(code).toMatch(SHORT_CODE_PATTERN);
    }
  });
});

describe("createLinkService", () => {
  it("returns a successfully inserted link", async () => {
    const repository: LinkRepository = {
      insert: vi.fn(async (input) => input),
    };
    const createLink = createLinkService({
      repository,
      generateCode: () => "a8Fk2Qp",
    });

    await expect(createLink("https://example.com/path")).resolves.toEqual({
      code: "a8Fk2Qp",
      targetUrl: "https://example.com/path",
    });
    expect(repository.insert).toHaveBeenCalledOnce();
  });

  it("generates another code after a database collision", async () => {
    const insert = vi
      .fn<LinkRepository["insert"]>()
      .mockResolvedValueOnce(null)
      .mockImplementationOnce(async (input) => input);
    const repository: LinkRepository = { insert };
    const generateCode = vi
      .fn()
      .mockReturnValueOnce("AAAAAAA")
      .mockReturnValueOnce("BBBBBBB");
    const createLink = createLinkService({ repository, generateCode });

    await expect(createLink("https://example.com/path")).resolves.toEqual({
      code: "BBBBBBB",
      targetUrl: "https://example.com/path",
    });
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert).toHaveBeenNthCalledWith(1, {
      code: "AAAAAAA",
      targetUrl: "https://example.com/path",
    });
    expect(insert).toHaveBeenNthCalledWith(2, {
      code: "BBBBBBB",
      targetUrl: "https://example.com/path",
    });
  });

  it("fails after five consecutive collisions", async () => {
    const repository: LinkRepository = {
      insert: vi.fn(async () => null),
    };
    const createLink = createLinkService({
      repository,
      generateCode: () => "AAAAAAA",
    });

    await expect(createLink("https://example.com/path")).rejects.toBeInstanceOf(
      ShortCodeGenerationError,
    );
    expect(repository.insert).toHaveBeenCalledTimes(5);
  });
});
