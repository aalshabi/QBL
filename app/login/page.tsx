"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HOME_BY_ROLE: Record<string, string> = {
  ADMIN: "/admin",
  OPS_MANAGER: "/admin",
  DISPATCHER: "/admin",
  COURIER: "/courier",
  CLIENT: "/",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "تعذر تسجيل الدخول، حاول مرة أخرى");
        return;
      }

      router.push(HOME_BY_ROLE[payload.role] ?? "/");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم، حاول مرة أخرى");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-muted/50 px-4">
      <Card className="w-full max-w-sm rounded-lg">
        <CardHeader className="items-start gap-2">
          <BrandLogo />
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            تسجيل الدخول
          </CardTitle>
          <p className="text-sm text-muted-foreground">لوحة التحكم متاحة للمستخدمين المصرّح لهم فقط</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ops.manager@qbl.sa"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              دخول
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
