import { buildApp } from "./app.js";
import { env } from "./config.js";
import { checkDatabaseConnection, closeDatabase } from "./db/index.js";
import { createLinkRepository } from "./links/repository.js";
import { createLinkService } from "./links/service.js";

const app = buildApp({
  createLink: createLinkService({ repository: createLinkRepository() }),
  publicBaseUrl: env.PUBLIC_BASE_URL,
  onClose: closeDatabase,
});

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
