import Link from "next/link";
import { ArrowRight, CheckCircle2, FileCheck, MapPinned, PackageCheck, Route, ShieldCheck, Snowflake, Thermometer, Truck } from "lucide-react";
import { SITE } from "@/lib/site";

const SERVICES = [
  ["B2B2C refrigerated delivery", "Temperature-aware last-mile delivery from business locations to end customers."],
  ["Fresh food delivery", "A disciplined model for dairy, fresh food, and sensitive chilled products."],
  ["Frozen items", "Dedicated trips for frozen products based on the agreed operating requirements."],
  ["Pharmacy and sensitive products", "Careful handling and delivery confirmation without unsupported certification claims."],
];

const PROCESS = [
  ["01", PackageCheck, "Pickup", "Product, pickup point, handling notes, and delivery window are confirmed before loading."],
  ["02", Truck, "Dispatch", "Vehicle, route, and delivery instructions are assigned around the product risk."],
  ["03", Route, "Coordination", "Trip status and operational updates are shared when configured for the client account."],
  ["04", FileCheck, "Confirmed delivery", "Delivery is closed with the agreed proof: signature, image, OTP, or report."],
];

export default function EnHomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-muted bg-white">
        <div className="absolute inset-0 brand-grid opacity-70" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8 lg:py-20">
          <div className="min-w-0 max-w-3xl self-center">
            <p className="inline-flex rounded-md border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-bold text-primary">
              {SITE.taglineEn}
            </p>
            <h1 className="mt-6 text-3xl font-extrabold leading-tight text-primary sm:text-5xl lg:text-6xl">
              Refrigerated delivery that protects product quality to the final meter
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slatebrand">
              QBL provides refrigerated last-mile delivery in Riyadh for businesses handling temperature-sensitive products. Clean operations, clear handoff, and delivery proof when required.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/quote"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-800"
              >
                Request operations quote
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-md border border-muted bg-white px-6 text-sm font-bold text-primary transition-colors hover:bg-muted/60"
              >
                العربية
              </Link>
            </div>
          </div>

          <div className="w-full min-w-0 self-center overflow-hidden rounded-lg border border-muted bg-white p-4 shadow-sm">
            <div className="rounded-md bg-primary p-5 text-white">
              <p className="font-latin text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                {SITE.lockupTaglineEn}
              </p>
              <h2 className="mt-2 text-2xl font-extrabold">Cold-chain operating model</h2>
              <div className="mt-8 grid gap-3">
                {[
                  ["Temperature-aware handling", Thermometer],
                  ["Riyadh last-mile routes", MapPinned],
                  ["Documented handoff", ShieldCheck],
                ].map(([label, Icon]) => {
                  const VisualIcon = Icon as typeof Thermometer;
                  return (
                    <div key={label as string} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/10 p-4">
                      <VisualIcon className="h-5 w-5 text-accent" />
                      <span className="font-semibold">{label as string}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-accent">Why QBL</p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary">Disciplined cold-chain operations, not generic delivery</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["Temperature discipline", "Operations start from product sensitivity and required handling."],
              ["Clear delivery handoff", "Delivery proof is defined by the client operating model."],
              ["Sensitive product fit", "Designed for fresh, frozen, pharmacy, and B2B/B2B2C flows."],
              ["Scalable structure", "Routes and procedures can be repeated as volume grows."],
            ].map(([title, desc]) => (
              <article key={title} className="rounded-lg border border-muted bg-white p-5">
                <Snowflake className="h-6 w-6 text-accent" />
                <h3 className="mt-5 text-lg font-extrabold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slatebrand">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-accent">Services</p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary">Refrigerated services for serious businesses</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(([title, desc]) => (
              <article key={title} className="rounded-lg border border-muted bg-white p-5">
                <h3 className="text-lg font-extrabold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slatebrand">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-accent">How it works</p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary">A clear path from pickup to documented delivery</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map(([step, Icon, title, desc]) => {
              const StepIcon = Icon as typeof PackageCheck;
              return (
                <article key={step as string} className="rounded-lg border border-muted bg-white p-5">
                  <div className="flex items-center justify-between">
                    <StepIcon className="h-6 w-6 text-accent" />
                    <span className="font-latin text-sm font-bold text-slatebrand/50">{step as string}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold text-primary">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-slatebrand">{desc as string}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-primary text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.7fr] lg:px-8">
          <div>
            <p className="text-sm font-bold text-accent">Trust architecture</p>
            <h2 className="mt-3 text-3xl font-extrabold">No fake testimonials. No unsupported metrics.</h2>
            <p className="mt-4 leading-7 text-white/70">
              QBL presents real capabilities clearly. Case studies, performance metrics, and client proof will only be published when verified and approved.
            </p>
          </div>
          <div className="grid gap-3">
            {["Handling procedures", "Delivery confirmation", "Temperature-aware operations"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/10 p-4">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
