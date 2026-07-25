import { cn } from "@/lib/utils";

/**
 * ProfitX brand mark — rounded-square tile in the brand blue gradient with a
 * white rising-chart arrow. Self-contained inline SVG (no asset fetch).
 */
export function ProfitXMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="profitx-mark-grad-admin"
          x1="0"
          y1="0"
          x2="48"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#profitx-mark-grad-admin)" />
      <path
        d="M12 31l7.5-7.5 5 4.5L35 16.5"
        stroke="white"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28.5 16.5H35V23"
        stroke="white"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfitXLogo({
  className,
  size = "md",
  markOnly = false,
  suffix,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  markOnly?: boolean;
  suffix?: string;
}) {
  const markCls =
    size === "lg" ? "size-12" : size === "sm" ? "size-8" : "size-10";
  const textCls =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-lg" : "text-xl";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ProfitXMark className={cn("shrink-0", markCls)} />
      {!markOnly && (
        <span className={cn("font-extrabold tracking-tight text-foreground", textCls)}>
          Profit<span className="text-primary">X</span>
          {suffix && (
            <span className="ml-1.5 text-muted-foreground">{suffix}</span>
          )}
        </span>
      )}
    </span>
  );
}
