import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../src/app.js";
import type { CreateLink } from "../src/links/service.js";
import { ShortCodeGenerationError } from "../src/links/service.js";

const apps: FastifyInstance[] = [];

function createTestApp(createLink: CreateLink) {
  const app = buildApp({
    createLink,
    publicBaseUrl: "https://sho.rt/",
    logger: false,
  });

  apps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map(async (app) => app.close()));
});

describe("POST /api/links", () => {
  it("creates and returns a short link", async () => {
    const createLink = vi.fn<CreateLink>().mockResolvedValue({
      code: "a8Fk2Qp",
      targetUrl: "https://example.com/some/long/path",
    });
    const app = createTestApp(createLink);

    const response = await app.inject({
      method: "POST",
      url: "/api/links",
      payload: { url: "https://example.com/some/long/path" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      code: "a8Fk2Qp",
      url: "https://example.com/some/long/path",
      shortUrl: "https://sho.rt/a8Fk2Qp",
    });
    expect(createLink).toHaveBeenCalledWith(
      "https://example.com/some/long/path",
    );
  });

  it.each([
    { url: "not-a-url" },
    { url: "/relative/path" },
    { url: "ftp://example.com/file" },
    {},
  ])("rejects an invalid request body: %j", async (payload) => {
    const createLink = vi.fn<CreateLink>();
    const app = createTestApp(createLink);

    const response = await app.inject({
      method: "POST",
      url: "/api/links",
      payload,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "INVALID_URL",
        message: "Требуется корректный абсолютный HTTP или HTTPS URL.",
      },
    });
    expect(createLink).not.toHaveBeenCalled();
  });

  it("returns a safe service-unavailable response after repeated collisions", async () => {
    const createLink = vi
      .fn<CreateLink>()
      .mockRejectedValue(new ShortCodeGenerationError());
    const app = createTestApp(createLink);

    const response = await app.inject({
      method: "POST",
      url: "/api/links",
      payload: { url: "https://example.com" },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      error: {
        code: "SHORT_CODE_GENERATION_FAILED",
        message: "Не удалось создать короткую ссылку. Повторите попытку.",
      },
    });
  });

  it("does not expose unexpected error details", async () => {
    const createLink = vi
      .fn<CreateLink>()
      .mockRejectedValue(new Error("links_code_unique database failure"));
    const app = createTestApp(createLink);

    const response = await app.inject({
      method: "POST",
      url: "/api/links",
      payload: { url: "https://example.com" },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Произошла непредвиденная ошибка.",
      },
    });
    expect(response.body).not.toContain("links_code_unique");
  });
});

describe("OpenAPI documentation", () => {
  it("serves Swagger UI and a detailed OpenAPI document", async () => {
    const app = createTestApp(
      vi.fn<CreateLink>().mockResolvedValue({
        code: "a8Fk2Qp",
        targetUrl: "https://example.com",
      }),
    );

    const uiResponse = await app.inject({
      method: "GET",
      url: "/documentation/",
    });
    const uiRedirectResponse = await app.inject({
      method: "GET",
      url: "/documentation",
    });
    const documentResponse = await app.inject({
      method: "GET",
      url: "/documentation/json",
    });
    const yamlResponse = await app.inject({
      method: "GET",
      url: "/documentation/yaml",
    });
    const document = documentResponse.json();

    expect(uiResponse.statusCode).toBe(200);
    expect(uiRedirectResponse.statusCode).toBe(200);
    expect(documentResponse.statusCode).toBe(200);
    expect(yamlResponse.statusCode).toBe(200);
    expect(yamlResponse.body).toContain("openapi: 3.1.0");
    expect(document.openapi).toBe("3.1.0");
    expect(document.info).toMatchObject({
      title: "URL Shortener API",
      version: "0.1.0",
    });
    expect(document.servers).toEqual([
      {
        url: "https://sho.rt",
        description: "Настроенный публичный адрес API",
      },
    ]);
    expect(document.paths).toHaveProperty("/health");
    expect(document.paths).toHaveProperty("/api/links");

    const createOperation = document.paths["/api/links"].post;
    expect(createOperation).toMatchObject({
      operationId: "createShortLink",
      tags: ["Ссылки"],
      summary: "Создать короткую ссылку",
    });
    expect(createOperation.description).toBeTruthy();
    const requestContent =
      createOperation.requestBody.content["application/json"];
    expect(requestContent.example).toEqual({
      url: "https://example.com/some/long/path",
    });
    expect(requestContent.schema.properties.url.format).toBe("uri");
    expect(createOperation.responses).toHaveProperty("201");
    expect(createOperation.responses).toHaveProperty("400");
    expect(createOperation.responses).toHaveProperty("500");
    expect(createOperation.responses).toHaveProperty("503");

    const createdResponse =
      createOperation.responses["201"].content["application/json"];
    expect(createdResponse.schema.properties.code).toMatchObject({
      minLength: 7,
      maxLength: 7,
      pattern: "^[A-Za-z0-9]{7}$",
    });
    expect(createdResponse.example).toMatchObject({ code: "a8Fk2Qp" });
    expect(
      createOperation.responses["400"].content["application/json"].example,
    ).toEqual({
      error: {
        code: "INVALID_URL",
        message: "Требуется корректный абсолютный HTTP или HTTPS URL.",
      },
    });
  });
});
