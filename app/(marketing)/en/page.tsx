import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck, Snowflake, Thermometer } from "lucide-react";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Temperature-Protected Cosmetics Delivery in Riyadh",
  description: "QBL Beauty Shield provides temperature-protected last-mile delivery for cosmetics and skincare in Riyadh, with protection set from manufacturer storage instructions.",
  alternates: {
    canonical: "https://qbl.sa/en",
    languages: { "ar-SA": "https://qbl.sa/", en: "https://qbl.sa/en", "x-default": "https://qbl.sa/" },
  },
};

const levels = [
  [ShieldCheck, "Heat Protected", "Insulated protection from direct sun and vehicle heat."],
  [Thermometer, "Temperature Controlled", "Higher control and documented readings when included in scope."],
  [Snowflake, "Refrigerated Delivery", "For products whose manufacturer instructions require refrigerated storage."],
] as const;

export default function EnHomePage() {
  const whatsapp = `https://wa.me/${SITE.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent("Hello QBL, I would like to discuss a Beauty Shield trial for cosmetics delivery in Riyadh.")}`;
  return (
    <main>
      <section className="relative overflow-hidden border-b border-muted bg-white">
        <div className="absolute inset-0 brand-grid opacity-70" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <p className="inline-flex rounded-md border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-bold text-primary">QBL Beauty Shield · Riyadh</p>
          <h1 className="mt-6 max-w-5xl text-4xl font-extrabold leading-tight text-primary sm:text-6xl">Temperature-protected last-mile delivery for cosmetics in Riyadh</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slatebrand">QBL Beauty Shield protects cosmetics and skincare from Saudi heat during the most exposed stage of their journey — the last mile to your customer&apos;s door. Protection levels are set per product, based on the manufacturer&apos;s storage instructions.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/en/trial" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-white hover:bg-primary-800">Start a Beauty Shield trial <ArrowRight className="h-4 w-4" /></Link>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-line bg-white px-6 text-sm font-bold text-primary hover:bg-muted/60">Talk to us on WhatsApp <MessageCircle className="h-4 w-4 text-accent" /></a>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-bold text-accent">The problem</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-extrabold text-primary">Standard delivery does not start from skincare storage requirements</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slatebrand">Vehicle-box heat and direct sun can expose products beyond their labeled storage conditions. The right response is not to refrigerate everything; it is to set protection from the manufacturer&apos;s instructions and the actual route risk.</p>
        </div>
      </section>

      <section className="bg-frost-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-bold text-accent">Three protection levels</p>
          <h2 className="mt-3 text-3xl font-extrabold text-primary">Never one-size-fits-all</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {levels.map(([Icon, title, text]) => (
              <article key={title} className="rounded-xl border border-line bg-white p-6"><Icon className="h-7 w-7 text-accent" /><h3 className="mt-5 text-xl font-extrabold text-primary">{title}</h3><p className="mt-3 text-sm leading-7 text-slatebrand">{text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div><p className="text-sm font-bold text-accent">Who it is for</p><h2 className="mt-3 text-3xl font-extrabold text-primary">Beauty businesses that need a documented last mile</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{["Global beauty brands", "Distributors", "E-commerce and D2C", "Pharmacy chains", "Derma clinics", "Salons"].map((item)=><div key={item} className="flex items-center gap-2 rounded-lg border border-line p-3 text-sm font-semibold text-primary"><CheckCircle2 className="h-4 w-4 text-accent" />{item}</div>)}</div></div>
          <div className="rounded-xl bg-primary p-7 text-white"><p className="text-sm font-bold text-accent">Start with a trial, not a contract</p><h2 className="mt-3 text-3xl font-extrabold">Review. Operate. Report. Decide.</h2><p className="mt-4 leading-8 text-white/70">We review your products, set protection levels, run a limited scope of live orders, and hand you a closing report. Then you decide.</p><Link href="/en/trial" className="mt-7 inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-bold text-primary">View the trial <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><p className="text-sm font-bold text-accent">What we do not claim</p><h2 className="mt-3 text-2xl font-extrabold text-primary">No certifications we do not hold. No guaranteed outcomes before the records prove them.</h2><p className="mt-3 max-w-3xl leading-7 text-slatebrand">Product listing and regulatory compliance remain the product owner&apos;s responsibility. QBL delivers the agreed operating and documentation scope.</p></div>
      </section>
    </main>
  );
}
