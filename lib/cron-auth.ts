import { createHash, timingSafeEqual } from "node:crypto";
export function validCronAuthorization(
  header: string | null,
  secret = process.env.CRON_SECRET,
): boolean {
  if (!secret || secret.length < 32 || !header) return false;
  return timingSafeEqual(
    createHash("sha256").update(header).digest(),
    createHash("sha256")
      .update("Bearer " + secret)
      .digest(),
  );
}
