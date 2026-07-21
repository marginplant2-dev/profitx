import { redirect } from "next/navigation";

/**
 * The standalone Home / Dashboard screen was removed per operator request —
 * the app now lands directly on the Market (watchlist) screen. This route
 * is kept only as a permanent redirect so any old bookmark, cached PWA
 * start_url, or deep link to /dashboard still resolves to the new landing.
 */
export default function DashboardIndex() {
  redirect("/marketwatch");
}
