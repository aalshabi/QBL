import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Snowflake, Thermometer } from "lucide-react";

export const metadata: Metadata = {
  title: "Beauty Shield — Temperature-Protected Cosmetics Delivery",
  description: "Three protection levels for cosmetics last-mile delivery in Riyadh, selected from manufacturer storage instructions and route risk.",
  alternates: {
    canonical: "https://qbl.sa/en/beauty-shield",
    languages: { "ar-SA": "https://qbl.sa/services/beauty-shield", en: "https://qbl.sa/en/beauty-shield", "x-default": "https://qbl.sa/services/beauty-shield" },
  },
};

export default function EnBeautyShieldPage() {
  return <main>
    <section className="bg-primary text-white"><div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><p className="text-sm font-bold text-accent">QBL Beauty Shield</p><h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight sm:text-6xl">Protection selected around the product, not a generic parcel category</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">We translate manufacturer storage instructions and route exposure into a documented last-mile protection level.</p><Link href="/en/trial" className="mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-accent px-6 text-sm font-bold text-primary">Start a trial <ArrowRight className="h-4 w-4" /></Link></div></section>
    <section className="bg-white"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><h2 className="text-3xl font-extrabold text-primary">Three operating levels</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{[[ShieldCheck,"Heat Protected","Insulated handling for products labeled to avoid heat and direct sun."],[Thermometer,"Temperature Controlled","Higher control and agreed documentation for specified ranges or higher-risk routes."],[Snowflake,"Refrigerated Delivery","For products explicitly labeled by the manufacturer for refrigerated storage."]].map(([Icon,title,text])=>{const LevelIcon=Icon as typeof ShieldCheck; return <article key={title as string} className="rounded-xl border border-line p-6"><LevelIcon className="h-7 w-7 text-accent"/><h3 className="mt-5 text-xl font-extrabold text-primary">{title as string}</h3><p className="mt-3 text-sm leading-7 text-slatebrand">{text as string}</p></article>})}</div></div></section>
    <section className="bg-frost-50"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><h2 className="text-3xl font-extrabold text-primary">What the operating model can document</h2><div className="mt-7 grid gap-3 md:grid-cols-2">{["Product category and storage reference","Protection level assigned to each category","Pickup and delivery handoff","Temperature readings when included in scope","Exceptions and escalation actions","Closing recommendation after the trial"].map(item=><div key={item} className="flex items-center gap-3 rounded-lg border border-line bg-white p-4 text-sm font-semibold text-primary"><CheckCircle2 className="h-5 w-5 text-accent"/>{item}</div>)}</div></div></section>
  </main>;
}
