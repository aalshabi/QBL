/** Synthetic operations are available only in explicitly local development/tests. */
export function demoDataAllowed(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return (
    !env.VERCEL &&
    !env.VERCEL_ENV &&
    (env.NODE_ENV === "development" || env.NODE_ENV === "test")
  );
}

export function assertDemoDataAllowed(): void {
  if (!demoDataAllowed()) throw new Error("OPERATIONAL_DATA_UNAVAILABLE");
}

export function requireDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const url = env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_NOT_CONFIGURED");
  return url;
}
