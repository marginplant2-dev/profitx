import { ReactNode } from "react";

/**
 * Reports now has a single page — the Tradebook download. The old tab nav
 * (P&L / Tradebook / Brokerage / Margin) was removed per operator, so this
 * layout just renders the page.
 */
export default function ReportsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
