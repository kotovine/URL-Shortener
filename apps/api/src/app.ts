import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyInstance } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import { registerLinkRoutes } from "./links/routes.js";
import { healthResponseSchema } from "./links/schemas.js";
import { type CreateLink, ShortCodeGenerationError } from "./links/service.js";

export interface BuildAppOptions {
  createLink: CreateLink;
  publicBaseUrl: string;
  onClose?: () => Promise<void>;
  logger?: boolean;
}

export function buildApp({
  createLink,
  publicBaseUrl,
  onClose,
  logger = true,
}: BuildAppOptions): FastifyInstance {
  const app = Fastify({ logger });
  const normalizedPublicBaseUrl = `${publicBaseUrl.replace(/\/+$/, "")}/`;

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  void app.register(fastifySwagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "URL Shortener API",
        description:
          "API для создания и постоянного хранения коротких ссылок в PostgreSQL.",
        version: "0.1.0",
      },
      servers: [
        {
          url: normalizedPublicBaseUrl.slice(0, -1),
          description: "Настроенный публичный адрес API",
        },
      ],
      tags: [
        {
          name: "Система",
          description: "Проверка состояния и служебные операции API.",
        },
        {
          name: "Ссылки",
          description: "Создание и управление короткими ссылками.",
        },
      ],
    },
    transform: jsonSchemaTransform,
  });

  void app.register(fastifySwaggerUi, {
    routePrefix: "/documentation",
    staticCSP: true,
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });

  app.after(() => {
    app.get(
      "/health",
      {
        schema: {
          operationId: "getHealth",
          tags: ["Система"],
          summary: "Проверить состояние API",
          description:
            "Возвращает краткий статус, когда процесс API готов принимать запросы.",
          response: { 200: healthResponseSchema },
        },
      },
      async () => ({ status: "ok" as const }),
    );

    registerLinkRoutes(app, {
      createLink,
      publicBaseUrl: normalizedPublicBaseUrl,
    });
  });

  app.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send({
        error: {
          code: "INVALID_URL",
          message: "Требуется корректный абсолютный HTTP или HTTPS URL.",
        },
      });
    }

    if (error instanceof ShortCodeGenerationError) {
      request.log.warn(
        { err: error },
        "Short code generation attempts exhausted",
      );

      return reply.code(503).send({
        error: {
          code: "SHORT_CODE_GENERATION_FAILED",
          message: "Не удалось создать короткую ссылку. Повторите попытку.",
        },
      });
    }

    request.log.error({ err: error }, "Unexpected request error");

    return reply.code(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Произошла непредвиденная ошибка.",
      },
    });
  });

  if (onClose) {
    app.addHook("onClose", onClose);
  }

  return app;
}
