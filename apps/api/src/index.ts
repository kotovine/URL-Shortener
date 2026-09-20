import Fastify from "fastify";

import { env } from "./config.js";
import { checkDatabaseConnection, closeDatabase } from "./db/index.js";

const app = Fastify();

app.get("/health", async () => ({ status: "ok" }));

app.addHook("onClose", closeDatabase);

try {
  await checkDatabaseConnection();
  await app.listen({ host: "127.0.0.1", port: env.PORT });
} catch (error) {
  console.error(
    "Failed to start API. Ensure PostgreSQL is reachable and migrations are applied.",
    error,
  );
  await app.close();
  process.exitCode = 1;
}
