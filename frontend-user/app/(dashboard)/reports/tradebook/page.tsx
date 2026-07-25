"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ReportPdfButton } from "@/components/common/ReportPdfButton";
import { DateRangeBar, toIsoFrom, toIsoTo, type DateRange } from "@/components/common/DateRangeBar";
import { Card } from "@/components/ui/card";

/**
 * Tradebook — download only. The on-screen trades table / mobile list /
 * pagination were removed per operator; the PDF is generated server-side by
 * ReportPdfButton, so the page just needs a date range + the two download
 * buttons.
 */
export default function TradebookPage() {
  const [range, setRange] = useState<DateRange>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { from: iso(from), to: iso(to) };
  });

  const fromIso = toIsoFrom(range.from);
  const toIso = toIsoTo(range.to);

  return (
    <div className="space-y-4">
      <PageHeader
        back
        title="Tradebook"
        description="Choose a date range and download your trade book."
      />

      <Card className="space-y-4 p-4">
        <DateRangeBar simple value={range} onChange={setRange} />
        <div className="flex flex-wrap gap-2">
          {/* Simple PDF — server-side, capped high enough to cover a full
              period in one file. Full Tradebook has no cap. */}
          <ReportPdfButton
            kind="tradebook"
            params={{ from_date: fromIso, to_date: toIso, limit: 2000 }}
            label="Simple PDF"
          />
          <ReportPdfButton
            kind="tradebook/full"
            params={{ from_date: fromIso, to_date: toIso }}
            label="Full Tradebook"
          />
        </div>
      </Card>
    </div>
  );
}
