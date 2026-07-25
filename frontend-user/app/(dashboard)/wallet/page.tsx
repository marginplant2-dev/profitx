import { redirect } from "next/navigation";

/**
 * The standalone Wallet page was removed per operator request — Add Funds /
 * Withdraw now open a dialog IN PLACE on the account (DemoAccount) screen.
 * This route is kept only as a permanent redirect so any old link, bookmark
 * or back-navigation lands on the account screen instead of a dead page.
 */
export default function WalletRedirect() {
  redirect("/profile");
}
