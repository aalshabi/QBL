import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "default" | "white";
  size?: "sm" | "md" | "lg";
}

const scale = {
  sm: {
    mark: 48,
    letters: "text-[34px]",
    arabic: "text-[16px]",
    underline: "w-8",
    gap: "gap-0",
  },
  md: {
    mark: 62,
    letters: "text-[44px]",
    arabic: "text-[20px]",
    underline: "w-10",
    gap: "gap-0.5",
  },
  lg: {
    mark: 82,
    letters: "text-[60px]",
    arabic: "text-[28px]",
    underline: "w-14",
    gap: "gap-1",
  },
};

export default function Logo({
  className,
  showText = true,
  variant = "default",
  size = "sm",
}: LogoProps) {
  const isWhite = variant === "white";
  const ink = isWhite ? "#FFFFFF" : "#0D1B3A";
  const s = scale[size];

  if (!showText) {
    return <QblMark dim={s.mark} inverse={isWhite} className={className} />;
  }

  return (
    <div className={cn("inline-flex flex-col items-center leading-none", className)}>
      <div dir="ltr" className={cn("flex items-end", s.gap)}>
        <QblMark dim={s.mark} inverse={isWhite} />
        <span
          className={cn("font-latin font-extrabold leading-[0.78] tracking-[0.02em] ltr", s.letters)}
          style={{ color: ink }}
        >
          BL
        </span>
      </div>
      <span
        className={cn("mt-1 font-bold leading-none tracking-[0.02em]", s.arabic)}
        style={{ color: ink }}
      >
        {SITE.brandAr}
      </span>
      <span className={cn("mt-1 h-0.5 rounded-full bg-accent", s.underline)} />
    </div>
  );
}

export function QblMark({
  dim = 64,
  inverse = false,
  className,
}: {
  dim?: number;
  inverse?: boolean;
  className?: string;
}) {
  const ink = inverse ? "#FFFFFF" : "#0D1B3A";
  const cut = inverse ? "#0D1B3A" : "#FFFFFF";
  const tailEnd = inverse ? "#FFFFFF" : "#0D1B3A";
  const teal = "#00A7B6";
  const chill = inverse ? "#7FE3EC" : "#3FCBD6";
  const gradientId = `qbl-tail-${dim}-${inverse ? "inverse" : "default"}`;

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="QBL mark"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="34" y1="96" x2="108" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor={teal} />
          <stop offset="0.55" stopColor={chill} />
          <stop offset="1" stopColor={tailEnd} />
        </linearGradient>
      </defs>
      <circle cx="56" cy="62" r="42" stroke={ink} strokeWidth="22" fill="none" />
      <path
        d="M34 80 C56 108 88 106 112 82"
        stroke={cut}
        strokeWidth="24"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M34 80 C56 108 88 106 112 82"
        stroke={`url(#${gradientId})`}
        strokeWidth="15"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="103" cy="24" r="9.5" stroke={teal} strokeWidth="7.5" fill="none" />
    </svg>
  );
}
