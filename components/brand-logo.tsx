import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  inverse?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { mark: 38, latin: "text-[27px]", arabic: "text-[13px]", rule: "w-7" },
  md: { mark: 48, latin: "text-[34px]", arabic: "text-[16px]", rule: "w-8" },
  lg: { mark: 60, latin: "text-[43px]", arabic: "text-[20px]", rule: "w-10" },
};

/** Official QBL lockup as used on qbl.sa: Q-mark + BL + Arabic name + teal rule. */
export function BrandLogo({ className, href = "/", inverse = false, size = "md" }: BrandLogoProps) {
  const scale = sizes[size];
  const ink = inverse ? "#FFFFFF" : "#0D1B3A";
  const gradientId = `qbl-tail-${size}-${inverse ? "inverse" : "default"}`;

  return (
    <Link href={href} className={cn("inline-flex flex-col items-center leading-none", className)} aria-label="قدام بابك - QBL">
      <div dir="ltr" className="flex items-end gap-0">
        <svg width={scale.mark} height={scale.mark} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" className="shrink-0">
          <defs>
            <linearGradient id={gradientId} x1="34" y1="96" x2="108" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00A7B6" />
              <stop offset="0.55" stopColor="#3FCBD6" />
              <stop offset="1" stopColor={ink} />
            </linearGradient>
          </defs>
          <circle cx="56" cy="62" r="42" stroke={ink} strokeWidth="22" />
          <path d="M34 80 C56 108 88 106 112 82" stroke={inverse ? "#0D1B3A" : "#FFFFFF"} strokeWidth="24" strokeLinecap="round" />
          <path d="M34 80 C56 108 88 106 112 82" stroke={`url(#${gradientId})`} strokeWidth="15" strokeLinecap="round" />
          <circle cx="103" cy="24" r="9.5" stroke="#00A7B6" strokeWidth="7.5" />
        </svg>
        <span className={cn("font-latin font-extrabold leading-[0.78] tracking-[0.02em]", scale.latin)} style={{ color: ink }}>BL</span>
      </div>
      <span className={cn("mt-1 font-bold leading-none tracking-[0.02em]", scale.arabic)} style={{ color: ink }}>قدام بابك</span>
      <span className={cn("mt-1 h-0.5 rounded-full bg-accent", scale.rule)} />
    </Link>
  );
}
