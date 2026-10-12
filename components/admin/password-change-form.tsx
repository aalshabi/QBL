"use client";

import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCOUNT_REQUEST_MARKER } from "@/lib/account/request-marker";

const MIN_LENGTH = 12;

const SERVER_MESSAGES: Record<string, string> = {
  INVALID_CURRENT_PASSWORD: "كلمة المرور الحالية غير صحيحة.",
  RATE_LIMITED: "محاولات كثيرة. انتظر دقيقة ثم أعد المحاولة.",
  UNAUTHORIZED: "انتهت الجلسة. سجّل الدخول من جديد.",
};

/**
 * تغيير كلمة مرور الحساب الحالي. الحقول تقبل اللصق، ولا تُحفظ القيم في أي مكان:
 * تُرسل مرة واحدة إلى /api/account/password ثم تُفرَّغ.
 */
export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const tooShort = newPassword.length > 0 && newPassword.length < MIN_LENGTH;
  const ready = currentPassword.length > 0 && newPassword.length >= MIN_LENGTH && confirmPassword === newPassword;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setStatus("saving");
    setMessage("");
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json", [ACCOUNT_REQUEST_MARKER.name]: ACCOUNT_REQUEST_MARKER.value },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string };
      if (response.ok && data.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setStatus("done");
        setMessage("تم تغيير كلمة المرور. استعمل الكلمة الجديدة في الدخول القادم.");
        return;
      }
      setStatus("error");
      setMessage(SERVER_MESSAGES[data.error ?? ""] ?? data.message ?? "تعذّر تغيير كلمة المرور. أعد المحاولة.");
    } catch {
      setStatus("error");
      setMessage("تعذّر الاتصال. تحقق من الشبكة وأعد المحاولة.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-5">
      <div className="grid gap-2">
        <Label htmlFor="current-password">كلمة المرور الحالية</Label>
        <Input
          id="current-password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
        <Input
          id="new-password"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          aria-describedby="new-password-hint"
        />
        <p id="new-password-hint" className={tooShort ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {MIN_LENGTH} حرفًا على الأقل، ولا تحتوي اسم الحساب.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
        <Input
          id="confirm-password"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          aria-invalid={mismatch}
        />
        {mismatch ? <p className="text-xs text-destructive">الكلمتان غير متطابقتين.</p> : null}
      </div>
      <Button type="submit" disabled={!ready || status === "saving"}>
        <KeyRound className="h-4 w-4" />
        {status === "saving" ? "جارٍ الحفظ..." : "تغيير كلمة المرور"}
      </Button>
      {message ? (
        <p role="status" className={status === "done" ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-destructive"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
