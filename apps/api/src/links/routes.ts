import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import type { CreateLink } from "./service.js";
import {
  createErrorResponseSchema,
  createLinkBodySchema,
  createLinkResponseSchema,
} from "./schemas.js";

export interface LinkRoutesOptions {
  createLink: CreateLink;
  publicBaseUrl: string;
}

export function registerLinkRoutes(
  app: FastifyInstance,
  { createLink, publicBaseUrl }: LinkRoutesOptions,
): void {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/api/links",
    {
      schema: {
        operationId: "createShortLink",
        tags: ["Ссылки"],
        summary: "Создать короткую ссылку",
        description:
          "Проверяет абсолютный HTTP/HTTPS URL, генерирует уникальный случайный код, сохраняет соответствие в PostgreSQL и возвращает публичную короткую ссылку.",
        body: createLinkBodySchema,
        response: {
          201: createLinkResponseSchema,
          400: createErrorResponseSchema(
            "INVALID_URL",
            "Требуется корректный абсолютный HTTP или HTTPS URL.",
          ).describe("Тело запроса не содержит корректный HTTP или HTTPS URL."),
          503: createErrorResponseSchema(
            "SHORT_CODE_GENERATION_FAILED",
            "Не удалось создать короткую ссылку. Повторите попытку.",
          ).describe(
            "Не удалось подобрать уникальный короткий код за несколько попыток.",
          ),
          500: createErrorResponseSchema(
            "INTERNAL_ERROR",
            "Произошла непредвиденная ошибка.",
          ).describe("Произошла непредвиденная внутренняя ошибка."),
        },
      },
    },
    async (request, reply) => {
      const link = await createLink(request.body.url);

      return reply.code(201).send({
        code: link.code,
        url: link.targetUrl,
        shortUrl: new URL(link.code, publicBaseUrl).toString(),
      });
    },
  );
}
