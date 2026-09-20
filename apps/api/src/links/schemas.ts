import { z } from "zod";

export const SHORT_CODE_LENGTH = 7;
export const SHORT_CODE_PATTERN = /^[A-Za-z0-9]{7}$/;

export const shortCodeSchema = z
  .string()
  .length(SHORT_CODE_LENGTH)
  .regex(SHORT_CODE_PATTERN)
  .describe(
    "Случайный семисимвольный короткий код из латинских букв в верхнем и нижнем регистре и цифр.",
  );

export const httpUrlSchema = z
  .url({ protocol: /^https?$/ })
  .describe("Абсолютный URL с протоколом HTTP или HTTPS.");

export const createLinkBodySchema = z
  .strictObject({
    url: httpUrlSchema.describe("Исходный URL, который требуется сократить."),
  })
  .meta({
    description: "Данные для создания короткой ссылки.",
    examples: [{ url: "https://example.com/some/long/path" }],
  });

export const createLinkResponseSchema = z
  .object({
    code: shortCodeSchema,
    url: httpUrlSchema.describe("Сохранённый исходный URL."),
    shortUrl: httpUrlSchema.describe(
      "Публичная короткая ссылка с созданным кодом.",
    ),
  })
  .meta({
    description: "Данные созданной короткой ссылки.",
    examples: [
      {
        code: "a8Fk2Qp",
        url: "https://example.com/some/long/path",
        shortUrl: "http://localhost:3000/a8Fk2Qp",
      },
    ],
  });

export const healthResponseSchema = z
  .object({
    status: z.literal("ok").describe("Текущее состояние API."),
  })
  .meta({
    description: "Результат проверки состояния API.",
    examples: [{ status: "ok" }],
  });

export function createErrorResponseSchema(
  code: "INVALID_URL" | "SHORT_CODE_GENERATION_FAILED" | "INTERNAL_ERROR",
  message: string,
) {
  return z
    .object({
      error: z.object({
        code: z.literal(code).describe("Стабильный машиночитаемый код ошибки."),
        message: z.string().describe("Понятное пользователю описание ошибки."),
      }),
    })
    .meta({
      examples: [{ error: { code, message } }],
    });
}

export type CreateLinkBody = z.infer<typeof createLinkBodySchema>;
export type CreateLinkResponse = z.infer<typeof createLinkResponseSchema>;
