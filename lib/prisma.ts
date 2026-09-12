import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

import { requireDatabaseUrl } from '@/lib/runtime-mode';

let prisma: PrismaClient | null = null;

export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: requireDatabaseUrl(),
      }),
    });
  }

  return prisma;
}
