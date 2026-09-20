import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({
  path: new URL("../../../.env", import.meta.url),
  quiet: true,
});

const environmentSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .refine((value) => {
      const protocol = new URL(value).protocol;

      return protocol === "postgres:" || protocol === "postgresql:";
    }, "must be a PostgreSQL connection URL"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  PUBLIC_BASE_URL: z.url({ protocol: /^https?$/ }).optional(),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues
    .map(
      (issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`,
    )
    .join("; ");

  throw new Error(`Invalid environment configuration: ${details}`);
}

const publicBaseUrl =
  result.data.PUBLIC_BASE_URL ?? `http://localhost:${result.data.PORT}`;

export const env = {
  ...result.data,
  PUBLIC_BASE_URL: `${publicBaseUrl.replace(/\/+$/, "")}/`,
};
