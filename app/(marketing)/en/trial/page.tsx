import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Beauty Shield Trial — Test Before a Long-Term Contract",
  description: "Review products, define protection levels, run a limited scope of live orders, and receive a closing report before deciding.",
  alternates: {
    canonical: "https://qbl.sa/en/trial",
    languages: { "ar-SA": "https://qbl.sa/trial", en: "https://qbl.sa/en/trial", "x-default": "https://qbl.sa/trial" },
  },
};

export default function EnTrialPage() {
  return <main>
    <section className="bg-primary text-white"><div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><p className="text-sm font-bold text-accent">Test before you commit</p><h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight sm:text-6xl">A live Beauty Shield trial, closed with a documented report</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">We review product instructions, assign protection levels, run an agreed limited scope of live orders, record exceptions, and hand you a closing recommendation.</p><Link href="/quote?service=beauty-shield" className="mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-accent px-6 text-sm font-bold text-primary">Request a trial review <ArrowRight className="h-4 w-4" /></Link></div></section>
    <section className="bg-white"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><h2 className="text-3xl font-extrabold text-primary">What happens</h2><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[["Review","Storage instructions, packaging, pickup points, and delivery areas."],["Design","Protection level and documentation scope per product category."],["Operate","A limited set of live orders under the agreed operating model."],["Decide","A closing report with exceptions and the proposed monthly model."]].map(([title,text])=><article key={title} className="rounded-xl border border-line p-5"><h3 className="text-lg font-extrabold text-primary">{title}</h3><p className="mt-3 text-sm leading-7 text-slatebrand">{text}</p></article>)}</div></div></section>
    <section className="bg-frost-50"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8"><div><h2 className="text-3xl font-extrabold text-primary">Pricing follows the operating model</h2><p className="mt-4 leading-8 text-slatebrand">Pricing is based on order volume, protection levels, pickup points, and documentation scope. The trial fee is set after product review. No first-month discount is promised until QBL confirms that commercial policy.</p></div><div className="rounded-xl border border-line bg-white p-6"><p className="text-xs font-bold uppercase tracking-wider text-accent">Illustrative sample — fictional data</p><h3 className="mt-3 text-2xl font-extrabold text-primary">See the closing report format</h3><p className="mt-3 text-sm leading-7 text-slatebrand">This sample shows structure only. It is not a client case study or a performance claim.</p><a href="/reports/beauty-shield-trial-sample.pdf" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-white"><Download className="h-4 w-4"/>Download PDF</a></div></div></section>
    <section className="bg-white"><div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8"><h2 className="text-3xl font-extrabold text-primary">Trial inputs</h2><div className="mt-6 grid gap-3">{["Product list and storage-label images","Packaging types and pickup points","Expected delivery volume and areas","Required handoff and documentation level"].map(item=><div key={item} className="flex items-center gap-3 text-sm font-semibold text-slatebrand"><CheckCircle2 className="h-5 w-5 text-accent"/>{item}</div>)}</div></div></section>
  </main>;
}
