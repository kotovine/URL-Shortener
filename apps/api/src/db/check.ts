import { checkDatabaseConnection, closeDatabase } from "./index.js";

try {
  await checkDatabaseConnection();
  console.log("Database connection and links table are ready.");
} finally {
  await closeDatabase();
}
