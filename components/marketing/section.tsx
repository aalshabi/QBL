import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function Section({
  eyebrow,
  title,
  description,
  children,
  tone = "white",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: "white" | "mist";
}) {
  return (
    <section className={tone === "mist" ? "bg-frost-50" : "bg-white"}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          {eyebrow ? <p className="text-sm font-bold text-accent">{eyebrow}</p> : null}
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-primary sm:text-4xl">{title}</h2>
          {description ? <p className="mt-4 text-lg leading-8 text-slatebrand">{description}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

// شريط دعوة الإجراء الموحد عبر الموقع — صيغتان فقط (تعليمات ملحق التنفيذ).
export function CtaBand({
  title,
  eyebrow = "ابدأ الآن",
  primary = { href: "/trial", label: "ابدأ تجربة Beauty Shield" },
  secondary,
}: {
  title: string;
  eyebrow?: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <div>
          <p className="text-sm font-bold text-accent">{eyebrow}</p>
          <h2 className="mt-2 max-w-3xl text-2xl font-extrabold leading-snug sm:text-3xl">{title}</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={primary.href}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-6 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            {primary.label}
            <ArrowLeft className="h-4 w-4" />
          </Link>
          {secondary ? (
            <Link
              href={secondary.href}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/5 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
