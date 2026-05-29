import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex flex-col items-start leading-none text-primary", className)}
      aria-label="قدام بابك للخدمات اللوجستية"
    >
      {/* QBL wordmark: Q-mark + BL letters. Ring and letters follow currentColor so the
          logo inverts cleanly on the dark footer; the swoosh and dot stay brand teal. */}
      <svg height="40" viewBox="0 0 270 116" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="block">
        <circle cx="48" cy="62" r="38" stroke="currentColor" strokeWidth="18" fill="none" />
        <path d="M30 78 C48 100 74 98 96 80" stroke="#00A7B6" strokeWidth="13" strokeLinecap="round" fill="none" />
        <circle cx="90" cy="28" r="7" stroke="#00A7B6" strokeWidth="6" fill="none" />
        <text
          x="120"
          y="100"
          textAnchor="start"
          style={{ direction: "ltr" }}
          fontFamily="Montserrat, system-ui, sans-serif"
          fontWeight="800"
          fontSize="104"
          letterSpacing="1"
          fill="currentColor"
        >
          BL
        </text>
      </svg>
      <span className="mt-1.5 text-sm font-bold leading-none tracking-[0.02em]">قدام بابك</span>
    </Link>
  );
}
