"use client";

import { useQuery } from "@tanstack/react-query";
import { SegmentSettingsAPI } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

type SegRow = {
  segment: string;
  label: string;
  action: "BUY" | "SELL";
  trading_allowed: boolean;
  min_lot: number | null;
  order_lot: number | null;
  max_lot: number | null;
  leverage: number | null;
  overnight_leverage: number | null;
  margin_percentage: number | null;
  commission_type: string | null;
  commission_value: number | null;
  min_brokerage: number | null;
};

function fmtLots(v: number | null | undefined): string {
  return v == null ? "—" : String(v);
}
function fmtX(v: number | null | undefined): string {
  return v == null || Number.isNaN(Number(v)) ? "—" : `${Number(v)}x`;
}
function fmtBrokerage(type: string | null, value: number | null): string {
  if (value == null) return "—";
  const t = String(type || "").toUpperCase();
  const suffix = t.includes("CRORE")
    ? "Per Crore"
    : t.includes("LOT")
      ? "Per Lot"
      : t.includes("PERCENT") || t === "%"
        ? "%"
        : t.includes("ORDER")
          ? "Per Order"
          : t.includes("FLAT")
            ? "Flat"
            : "";
  return `${value}${suffix ? " " + suffix : ""}`.trim();
}

export default function MarginPage() {
  const user = useAuthStore((s) => s.user);
  const { data: segs = [], isLoading } = useQuery<SegRow[]>({
    queryKey: ["segment-settings", "all"],
    queryFn: () => SegmentSettingsAPI.all() as Promise<SegRow[]>,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        back
        title="Margin"
        description="Your margin, brokerage & lot limits across every segment."
      />

      {/* Client information */}
      <section className="overflow-hidden rounded-xl border border-border bg-card p-4">
        <SectionHeader color="primary" label="Client Information" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="User ID" value={user?.user_code ?? "—"} />
          <Field label="Username" value={user?.full_name ?? "—"} />
        </div>
      </section>

      {isLoading && !segs.length ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          Loading settings…
        </div>
      ) : (
        segs.map((s, i) => (
          <section
            key={`${s.segment}-${s.action}-${i}`}
            className="overflow-hidden rounded-xl border border-border bg-card p-4"
          >
            <SectionHeader
              color={s.trading_allowed ? "buy" : "sell"}
              label={`${s.label} Settings`}
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Field
                label="Trading"
                value={
                  <span
                    className={cn(
                      "inline-block rounded-md px-2 py-0.5 text-xs font-bold",
                      s.trading_allowed
                        ? "bg-buy/15 text-buy"
                        : "bg-sell/15 text-sell",
                    )}
                  >
                    {s.trading_allowed ? "Allowed" : "Blocked"}
                  </span>
                }
              />
              <Field
                label="Brokerage"
                value={fmtBrokerage(s.commission_type, s.commission_value)}
              />
              <Field label="Max Lots" value={fmtLots(s.max_lot)} />
              <Field label="Order Lots" value={fmtLots(s.order_lot)} />
              <Field label="Holding Margin" value={fmtX(s.overnight_leverage)} accent />
              <Field label="Intraday Margin" value={fmtX(s.leverage)} accent />
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function SectionHeader({
  color,
  label,
}: {
  color: "primary" | "buy" | "sell";
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          color === "buy"
            ? "bg-buy"
            : color === "sell"
              ? "bg-sell"
              : "bg-primary",
        )}
      />
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </h2>
    </div>
  );
}

function Field({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-[#121e2c] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 font-tabular text-sm font-bold tabular-nums",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}
