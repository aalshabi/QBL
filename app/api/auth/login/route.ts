import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { verifyCredentials } from "@/lib/auth-users";
import { createSessionToken } from "@/lib/security";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(
      { error: "INVALID_PAYLOAD", message: "أدخل بريداً إلكترونياً وكلمة مرور" },
      { status: 422 },
    );
  }

  const user = await verifyCredentials(body.data.email, body.data.password);
  if (!user) {
    return NextResponse.json(
      { error: "INVALID_CREDENTIALS", message: "بيانات الدخول غير صحيحة" },
      { status: 401 },
    );
  }

  const token = await createSessionToken(user.userId, user.role);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return NextResponse.json({ ok: true, name: user.name, role: user.role });
}
