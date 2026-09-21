import "server-only";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { findSilentSensors, readColdChainLiveState } from "@/lib/cold-chain/alerts";
import { getProviderMappings } from "@/lib/cold-chain/providers";
import { getPollConfig } from "@/lib/cold-chain/poll";
import { staleAfterMinutes } from "@/lib/cold-chain/thresholds";

/**
 * فحص اتصال سلسلة التبريد — ما يقابل "فحص الاتصال" الموجود لبقية التكاملات،
 * ولم يكن للتبريد مثله. يجيب عن سؤال واحد: هل الربط يعمل فعلاً الآن؟
 * ولا يُعيد أي سر: أطوال ووجود فقط.
 */

export type ColdChainHealth = {
  ready: boolean;
  webhookKeyConfigured: boolean;
  providers: string[];
  pollConfigured: boolean;
  registeredSensors: number;
  activeSensors: number;
  silentSensors: number;
  lastReadingAt: string | null;
  lastReadingMinutesAgo: number | null;
  staleAfterMinutes: number;
  blockers: string[];
};

export async function checkColdChainHealth(prisma: PrismaClient, now = new Date()): Promise<ColdChainHealth> {
  const webhookKeyConfigured = (process.env.COLD_CHAIN_TELEMETRY_API_KEY?.trim().length ?? 0) >= 32;
  const providers = [...getProviderMappings().keys()];

  let pollConfigured = false;
  try {
    getPollConfig();
    pollConfigured = true;
  } catch {
    pollConfigured = false;
  }

  const [live, silent] = await Promise.all([
    readColdChainLiveState(prisma),
    findSilentSensors(prisma, { now }),
  ]);

  const minutesAgo = live.lastReadingAt
    ? Math.floor((now.getTime() - live.lastReadingAt.getTime()) / 60_000)
    : null;

  const blockers: string[] = [];
  if (!webhookKeyConfigured && !pollConfigured) blockers.push("NO_INGESTION_CONFIGURED");
  if (live.registeredSensors === 0) blockers.push("NO_SENSOR_REGISTERED");
  if (live.lastReadingAt === null) blockers.push("NO_READING_RECEIVED");

  return {
    // جاهز يعني: وصلت قراءة حديثة من جهاز مسجّل — لا أن الإعداد مكتمل.
    ready: blockers.length === 0 && minutesAgo !== null && minutesAgo <= staleAfterMinutes(),
    webhookKeyConfigured,
    providers,
    pollConfigured,
    registeredSensors: live.registeredSensors,
    activeSensors: live.activeSensors,
    silentSensors: silent.length,
    lastReadingAt: live.lastReadingAt?.toISOString() ?? null,
    lastReadingMinutesAgo: minutesAgo,
    staleAfterMinutes: staleAfterMinutes(),
    blockers,
  };
}
