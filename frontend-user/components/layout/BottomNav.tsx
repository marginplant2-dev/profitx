"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookText,
  Settings,
  Star,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Five-section mobile terminal nav (matches the app screenshots):
// MARKET · ORDERS · CHART · POSITION · DEMOACCOUNT. The centre slot is the
// live candlestick chart. Active tab paints the blue accent.
const items = [
  { href: "/marketwatch", label: "MARKET", icon: Star },
  { href: "/orders", label: "ORDERS", icon: BookText },
  { href: "/terminal", label: "CHART", icon: BarChart3 },
  // /positions is the unified blotter (Position / Active / Closed tabs).
  { href: "/positions", label: "POSITION", icon: Zap },
  // /profile is the account / settings screen ("DemoAccount").
  { href: "/profile", label: "DEMOACCOUNT", icon: Settings },
];

/**
 * Mobile-only bottom tab bar. Hidden ≥ md so the desktop sidebar is the
 * single nav surface there. Sits above the page in a translucent sticky
 * footer with safe-area padding.
 *
 * Edge-to-edge, full-width — the previous "compact pill" mode was
 * rejected by the user ("ye jo box ke andar rakh hai waisa mat rakh
 * yrr"). One consistent shape across every mobile route now.
 */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        // Solid bg (no backdrop-blur): a fixed full-width blur bar makes iOS
        // Safari re-composite the whole viewport every frame → the iPhone-only
        // scroll jank + slow route transitions. Solid is visually equivalent
        // and cheap. Android Chrome handled the blur fine; iOS does not.
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background",
        "md:hidden",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.href || pathname?.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("size-5", active && "scale-110")} />
                <span className="font-medium">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
