import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaExternal?: boolean;
}

export default function PageHero({
  eyebrow,
  title,
  description,
  ctaHref,
  ctaLabel = "اطلب عرض تشغيل",
  secondaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaExternal = false,
}: PageHeroProps) {
  const SecondaryTag = secondaryCtaExternal ? "a" : Link;
  const secondaryProps = secondaryCtaExternal
    ? { href: secondaryCtaHref ?? "#", target: "_blank", rel: "noopener" }
    : { href: secondaryCtaHref ?? "#" };

  return (
    <section className="border-b border-muted bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-sm font-bold text-accent">{eyebrow}</p>
        <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_0.36fr] lg:items-end">
          <div>
            <h1 className="max-w-4xl text-3xl font-extrabold leading-tight sm:text-5xl">{title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">{description}</p>
          </div>
          {(ctaHref || secondaryCtaHref) && (
            <div className="flex flex-col gap-3">
              {ctaHref && (
                <Link
                  href={ctaHref}
                  className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-bold text-primary transition-colors hover:bg-muted"
                >
                  {ctaLabel}
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              )}
              {secondaryCtaHref && secondaryCtaLabel && (
                <SecondaryTag
                  {...(secondaryProps as { href: string })}
                  className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-md border border-white/20 bg-white/5 px-5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  {secondaryCtaLabel}
                  <MessageCircle className="h-4 w-4 text-accent" />
                </SecondaryTag>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
