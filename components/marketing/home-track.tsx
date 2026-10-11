"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Homepage shipment-tracking entry. Takes only the shipment number here and
 * hands it to /track, where the recipient confirms the last 4 digits of their
 * phone (the anti-enumeration second factor enforced by /api/tracking/lookup).
 * We never claim a result on the homepage — this just makes tracking the first
 * thing a returning customer can reach, including on mobile.
 */
export function HomeTrack() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(`/track?code=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur">
      <p className="text-sm font-bold text-accent">تتبع شحنتك</p>
      <h2 className="mt-1 text-lg font-bold">أين شحنتي؟</h2>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="home-track-code" className="sr-only">
          رقم الشحنة
        </label>
        <Input
          id="home-track-code"
          dir="ltr"
          className="ltr flex-1 bg-white text-primary placeholder:text-muted-foreground"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="أدخل رقم الشحنة"
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={!code.trim()}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Search className="h-4 w-4" />
          تتبع
        </Button>
      </form>
      <p className="mt-2 text-xs text-white/70">
        سنطلب آخر 4 أرقام من جوالك المسجّل على الطلب في الخطوة التالية للتحقق.
      </p>
    </div>
  );
}
