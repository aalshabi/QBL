import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const META_SIGNATURE_HEADER = "x-hub-signature-256";

export function sha256(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

export function verifyMetaSignature(rawBody: Buffer, header: string | null, appSecret: string) {
  if (!header?.startsWith("sha256=") || appSecret.length < 32) return false;
  const supplied = Buffer.from(header.slice(7), "hex");
  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function safeText(text: string, max = 240) {
  return text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
