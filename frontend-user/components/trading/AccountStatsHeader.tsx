"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { PositionAPI, WalletAPI } from "@/lib/api";
import { cn, formatINR, pnlColor } from "@/lib/utils";

/**
 * Collapsible account-stats header — Ledger Balance / Margin Available /
 * Margin Used / M2M in a 2×2 card grid, toggled by the title chevron.
 * Used by both MarketWatch (open by default) and Positions (collapsed by
 * default) so the four stat boxes look identical on both screens.
 *
 * Reads the SAME React Query keys the rest of the app already polls
 * (["wallet","summary"], ["positions","pnl-summary"]) — shared cache, no
 * extra network load.
 */
export function AccountStatsHeader({
  title,
  defaultOpen = true,
  rightAction,
  className,
}: {
  title: string;
  defaultOpen?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

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
    <div className={className}>
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
      <div className="flex items-center gap-2 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle account stats"
          className="flex flex-1 items-center text-left"
        >
          <span className="text-lg font-bold tracking-tight text-foreground">
            {title}
          </span>
        </button>
        {rightAction}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Hide account stats" : "Show account stats"}
          className="-mr-1 shrink-0 p-1"
        >
          <ChevronDown
            className={cn(
              "size-5 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </div>
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
