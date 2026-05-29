import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";

const encoder = new TextEncoder();

function secretFromEnv(name: string, fallback: string) {
  return encoder.encode(process.env[name] ?? fallback);
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

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashOtp(code: string) {
  const pepper = process.env.OTP_PEPPER ?? "dev-otp-pepper-change-me";
  return bcrypt.hash(`${code}:${pepper}`, 12);
}

export async function compareOtp(code: string, hash: string) {
  const pepper = process.env.OTP_PEPPER ?? "dev-otp-pepper-change-me";
  return bcrypt.compare(`${code}:${pepper}`, hash);
}

export async function hashToken(token: string) {
  return bcrypt.hash(token, 10);
}
