"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBranding } from "@/lib/branding-context";
import { API_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ProfitXMark } from "@/components/common/ProfitXLogo";

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
      <div className="relative size-16 shadow-lg shadow-blue-500/25">
        <ProfitXMark className="size-16" />
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
            Profit<span className="text-blue-400">X</span>
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
    <main className="flex min-h-screen w-full items-start justify-center bg-[#0a0e17] px-5 pb-10 pt-14 sm:items-center sm:pt-10">
      {/* No card — the form sits directly on the page background (operator:
          "card ke andar mat rakh, normal rakh"). Just a max-width column. */}
      <div className="w-full max-w-[400px]">
        <BrandMark logoSrc={logoSrc} name={name} />
        {children}
      </div>
    </main>
  );
}
