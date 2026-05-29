import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

let prisma: PrismaClient | null = null;

export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/qdl?schema=public",
      }),
    });
  }

  return prisma;
}
