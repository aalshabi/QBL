"use client";

import { Printer } from "lucide-react";

export function PrintProfileButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-5 text-sm font-bold text-white transition-colors hover:bg-white/15"
    >
      <Printer className="h-4 w-4" />
      طباعة أو حفظ PDF
    </button>
  );
}
