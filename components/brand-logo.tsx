import Link from "next/link";
import { Snowflake, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)} aria-label="قدام بابك للخدمات اللوجستية">
      <span className="relative grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
        <Truck className="h-6 w-6" aria-hidden="true" />
        <Snowflake className="absolute -bottom-1 -start-1 h-4 w-4 rounded-full bg-accent p-0.5 text-accent-foreground" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-bold text-primary">قدام بابك</span>
        <span className="mt-1 text-xs font-medium tracking-wide text-muted-foreground ltr">QBL · Logistics</span>
      </span>
    </Link>
  );
}
