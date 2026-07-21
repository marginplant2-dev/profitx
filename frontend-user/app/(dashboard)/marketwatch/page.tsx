"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { PositionAPI, WalletAPI } from "@/lib/api";
import { MobileInstrumentsBar } from "@/components/trading/MobileInstrumentsBar";
import { TradeDetailSheet } from "@/components/trading/TradeDetailSheet";
import { cn, formatINR, pnlColor } from "@/lib/utils";

/**
 * Markets page — browse + search every tradable instrument, star favorites,
 * tap a row to open the slide-up trade card with all order-placement
 * controls (no route change, so the user returns to the same scroll
 * position when the card closes).
 */
type SeedQuote = {
  ltp?: number | null;
  bid?: number | null;
  ask?: number | null;
  symbol?: string | null;
  exchange?: string | null;
  segment?: string | null;
} | null;

/**
 * Collapsible account-stats header shown above the watchlist (matches the
 * terminal screenshot): Ledger Balance / Margin Available / Margin Used /
 * M2M in a 2×2 card grid, toggled by the "MarketWatch" title chevron.
 *
 * Reuses the SAME React Query keys the rest of the app already polls
 * (["wallet","summary"], ["positions","pnl-summary"]) so this adds no new
 * network load — it just reads the shared cache.
 */
function MarketWatchStatsHeader() {
  const [open, setOpen] = useState(true);

  const { data: wallet } = useQuery<any>({
    queryKey: ["wallet", "summary"],
    queryFn: () => WalletAPI.summary(),
    refetchInterval: 10_000,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });
  const { data: pnl } = useQuery<any>({
    queryKey: ["positions", "pnl-summary"],
    queryFn: () => PositionAPI.pnlSummary(),
    refetchInterval: 5_000,
  });

  const available = Number(wallet?.available_balance ?? 0);
  const used = Number(wallet?.used_margin ?? wallet?.margin ?? 0);
  const ledger = Number(wallet?.bal ?? available + used);
  const m2m = Number(
    pnl?.open_unrealised ??
      pnl?.unrealized_pnl ??
      wallet?.open_unrealized_pnl ??
      0,
  );

  return (
    <div className="shrink-0 border-b border-border bg-background px-3 pt-3">
      {open && (
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Ledger Balance" value={formatINR(ledger)} />
          <Stat label="Margin Available" value={formatINR(available)} />
          <Stat label="Margin Used" value={formatINR(used)} />
          <Stat
            label="M2M"
            value={`${m2m >= 0 ? "+" : ""}${formatINR(m2m)}`}
            valueClassName={pnlColor(m2m)}
          />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-2.5"
      >
        <span className="text-lg font-bold tracking-tight text-foreground">
          MarketWatch
        </span>
        <ChevronDown
          className={cn(
            "size-5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 font-tabular text-sm font-bold tabular-nums text-foreground",
          valueClassName,
        )}
      >
        {value}
      </div>
    </div>
  );
}

export default function MarketsPage() {
  const [tradeToken, setTradeToken] = useState<string | null>(null);
  // Last-known price of the tapped row, handed to the trade card so it
  // paints a price INSTANTLY instead of sitting at 0.00 while its own WS
  // connection warms up on first open.
  const [seedQuote, setSeedQuote] = useState<SeedQuote>(null);

  return (
    // Full-bleed on mobile: negative margins cancel the dashboard layout's
    // p-4 / pb-24 so the markets view runs edge-to-edge (no floating card),
    // sized to fill exactly between the sticky TopBar (h-14) and the fixed
    // BottomNav (h-14). Desktop keeps the normal padded panel.
    //
    // The height ALSO subtracts the top + bottom safe-area insets. Without
    // them the container was ~80 px TALLER than the real gap on iOS notch
    // devices (Dynamic Island + home-bar), so the watchlist's last rows fell
    // behind the fixed BottomNav / off the bottom edge and couldn't be
    // scrolled into view — the "marketwatch iOS me scroll nahi hota" bug.
    // The insets resolve to 0 on non-notch / Android / desktop, so this is a
    // no-op everywhere else.
    <div
      className="-mx-4 -mt-4 -mb-24 flex flex-col md:mx-0 md:mt-0 md:mb-0 md:h-[calc(100vh-7rem)] md:min-h-[480px]"
      style={{
        height:
          "calc(100dvh - 7rem - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
      }}
    >
      {/* Account stats + "MarketWatch" title (collapsible). Screenshot-matched
          header that sits above the instrument list. */}
      <MarketWatchStatsHeader />

      {/* MobileInstrumentsBar is `h-full`, so wrap it in a flex-1 min-h-0
          box — it then fills exactly the space left under the stats header
          and scrolls its own list internally. */}
      <div className="min-h-0 flex-1">
        <MobileInstrumentsBar
          activeToken={tradeToken}
          onSelect={(token, seed) => {
            setTradeToken(token);
            setSeedQuote(seed ?? null);
          }}
        />
      </div>

      <TradeDetailSheet
        token={tradeToken}
        open={!!tradeToken}
        seedQuote={seedQuote}
        onClose={() => setTradeToken(null)}
        // In-sheet Option Chain picker on mobile swaps the displayed
        // strike instead of full-route bouncing to /terminal — the
        // user stays in the marketwatch → trade flow.
        onSwap={(tok) => setTradeToken(tok)}
      />
    </div>
  );
}
