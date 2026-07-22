"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { useBranding } from "@/lib/branding-context";
import { API_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * ProfitX auth shell — a single, centered, dark card (Trade-app style).
 * White-label aware: when a tenant brand (logo + name) is resolved it
 * overrides the default ProfitX mark; otherwise the emerald ProfitX
 * glyph + wordmark renders so there's never a blank tile.
 */
function BrandMark({ logoSrc, name }: { logoSrc: string | null; name: string }) {
  const [imgOk, setImgOk] = useState(false);
  const isDefault = name.toLowerCase() === "profitx";
  return (
    <div className="mb-6 flex flex-col items-center gap-3">
      <div className="relative grid size-16 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#10b981] to-[#047857] shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/30">
        <TrendingUp className="size-8 text-white" strokeWidth={2.6} />
        {logoSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt={name}
            onLoad={() => setImgOk(true)}
            onError={() => setImgOk(false)}
            className={cn(
              "absolute inset-0 size-full rounded-2xl bg-white object-contain p-1.5 transition-opacity",
              imgOk ? "opacity-100" : "opacity-0",
            )}
          />
        )}
      </div>
      <h1 className="text-xl font-extrabold tracking-tight text-white">
        {isDefault ? (
          <>
            Profit<span className="text-emerald-400">X</span>
          </>
        ) : (
          name
        )}
      </h1>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<main className="min-h-screen w-full bg-[#0a0e17]" />}>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </Suspense>
  );
}

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const { branding } = useBranding();
  const tenantName = (branding?.brand_name ?? "").trim();
  const name = tenantName || "ProfitX";
  const logoSrc = branding?.logo_url ? `${API_URL}${branding.logo_url}` : null;

  const isImpersonating = !!(
    searchParams?.get("access") && searchParams?.get("refresh")
  );

  if (isImpersonating) {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-[#0a0e17]">
        {children}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#0a0e17] p-4">
      <div className="w-full max-w-[400px] rounded-2xl border border-white/10 bg-[#131a26] p-6 shadow-2xl shadow-black/50 sm:p-8">
        <BrandMark logoSrc={logoSrc} name={name} />
        {children}
      </div>
    </main>
  );
}
