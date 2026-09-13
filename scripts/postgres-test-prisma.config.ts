import { defineConfig } from "prisma/config";
import { requirePostgresTestTarget } from "./postgres-test-guard.mjs";

// Deliberately does not import dotenv or the deployment Prisma configuration.
const target = requirePostgresTestTarget();
export default defineConfig({
  schema: "../prisma/schema.prisma",
  migrations: { path: "../prisma/migrations" },
  datasource: { url: target.connectionString },
});
