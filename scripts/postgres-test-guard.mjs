/** Refuse ambient, hosted, or unrelated database targets in the local-only harness. */
/** @param {Record<string, string | undefined>} env */
export function requirePostgresTestTarget(env = process.env) {
  const runId = env.QBL_POSTGRES_TEST_RUN_ID;
  if (!/^[a-f0-9]{24}$/.test(runId ?? "")) throw new Error("POSTGRES_TEST_RUN_REQUIRED");
  const target = new URL(env.DATABASE_URL ?? "");
  if (
    target.protocol !== "postgresql:" || target.hostname !== "127.0.0.1" ||
    !/^\d+$/.test(target.port) || Number(target.port) < 1024 || Number(target.port) > 65535 ||
    target.pathname !== `/qbl_test_${runId}` || target.username !== "qbl_test" ||
    !target.password || target.search !== "" || target.hash !== "" ||
    env.DIRECT_URL !== env.DATABASE_URL || env.VERCEL || env.VERCEL_ENV
  ) throw new Error("UNSAFE_POSTGRES_TEST_TARGET");
  return { runId, connectionString: target.href, database: target.pathname.slice(1) };
}
