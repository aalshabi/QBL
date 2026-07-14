import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";

const encoder = new TextEncoder();

/** في الإنتاج السر إلزامي — fail-closed بدل توقيع/تمليح بسر تطوير معروف. */
function requireSecret(name: string, fallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be set in production`);
  }
  return fallback;
}

function secretFromEnv(name: string, fallback: string) {
  return encoder.encode(requireSecret(name, fallback));
}

export async function createTrackingToken(orderId: string, expiresIn = "8h") {
  return new SignJWT({ orderId, scope: "tracking" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretFromEnv("TRACKING_TOKEN_SECRET", "dev-tracking-secret-change-me"));
}

export async function verifyTrackingToken(token: string) {
  const { payload } = await jwtVerify(token, secretFromEnv("TRACKING_TOKEN_SECRET", "dev-tracking-secret-change-me"));

  if (payload.scope !== "tracking" || typeof payload.orderId !== "string") {
    throw new Error("Invalid tracking token scope");
  }

  return { orderId: payload.orderId };
}

export async function createSessionToken(userId: string, role: string, expiresIn = "12h") {
  return new SignJWT({ scope: "session", role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretFromEnv("SESSION_SECRET", "dev-session-secret-change-me"));
}

export async function verifySessionToken(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretFromEnv("SESSION_SECRET", "dev-session-secret-change-me"));
    if (payload.scope !== "session" || typeof payload.sub !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashOtp(code: string) {
  const pepper = requireSecret("OTP_PEPPER", "dev-otp-pepper-change-me");
  return bcrypt.hash(`${code}:${pepper}`, 12);
}

export async function compareOtp(code: string, hash: string) {
  const pepper = requireSecret("OTP_PEPPER", "dev-otp-pepper-change-me");
  return bcrypt.compare(`${code}:${pepper}`, hash);
}

export async function hashToken(token: string) {
  return bcrypt.hash(token, 10);
}
