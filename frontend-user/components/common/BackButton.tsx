"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Round 36px back button. Defaults to browser back (`router.back()`);
 * pass `href` to push a specific route instead.
 */
export function BackButton({
  href,
  className,
}: {
  href?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => (href ? router.push(href) : router.back())}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="size-4" />
    </button>
  );
}
