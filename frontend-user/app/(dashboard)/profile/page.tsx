"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  AtSign,
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  IdCard,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Moon,
  Palette,
  Phone,
  ReceiptText,
  Shield,
  ShieldCheck,
  ShieldOff,
  SlidersHorizontal,
  Sun,
  User as UserIcon,
  Wallet as WalletIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { ProfileAPI, AuthAPI, WalletAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAuthStore } from "@/stores/authStore";
import {
  buildMailtoUrl,
  buildWhatsappUrl,
  useSupportContacts,
} from "@/lib/useSupport";
import { cn, formatINR } from "@/lib/utils";

/**
 * Mobile-first profile screen modelled on Zerodha Kite / Groww — a
 * clean avatar header on top followed by grouped list sections
 * (Account, Security, Preferences, Support, About). Tapping any row
 * drills into a sub-screen (rendered in this same component, gated by
 * `subView` state) so the flow feels like a real mobile-app navigation
 * stack while staying on the single `/profile` route. Desktop keeps the
 * same screens but renders them stacked in a single column for now —
 * the visual treatment scales up cleanly.
 *
 * Replaces the earlier tab-based profile that the user called out as
 * "bekar sa hai yrr" — sections were a flat horizontal tab strip and
 * the cards inside felt like an admin form, not a consumer profile.
 */
type SubView =
  | "main"
  | "personal"
  | "security"
  | "appearance"
  | "support";

export default function ProfilePage() {
  // The persisted login user (zustand `nb.auth`) is our offline-safe seed.
  // It carries every field the main profile screen renders (name, code,
  // email, status, role, is_demo, 2FA), so we can paint a correct profile
  // instantly and never show the error wall while a logged-in user's
  // /users/me round-trip is in flight or briefly fails on a weak network.
  const storeUser = useAuthStore((s) => s.user);
  const {
    data: fetched,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["me"],
    queryFn: () => ProfileAPI.me(),
    // Seed from the persisted login user so the screen is populated on the
    // very first paint. `initialDataUpdatedAt: 0` marks it stale so a fresh
    // /users/me still fetches immediately on mount to fill the extra fields
    // (kyc, created_at, last_login_at, …).
    initialData: storeUser ? (storeUser as any) : undefined,
    initialDataUpdatedAt: 0,
    // Profile was the ONLY screen backed by a single one-shot fetch with no
    // poll — every other page (positions 2s / orders 4s / wallet 10s) self-
    // heals a transient mobile-network blip on its next tick, so the blip is
    // invisible there. On Profile that one failed fetch stuck on "Could not
    // load profile" until a manual Retry that also failed on weak signal
    // ("bar bar problem"). Give it the same safety net: keep it gently
    // refreshing and recover on focus / reconnect.
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30_000,
  });
  // Prefer the freshest server copy; fall back to the persisted login user
  // so a logged-in client always sees their profile, never a dead wall.
  const me = fetched ?? storeUser;

  // Wallet summary powers the "Margin Available" card at the top of the
  // account screen. Reuses the SAME ["wallet","summary"] cache the TopBar /
  // WalletStrip / marketwatch header already poll — no extra network load.
  const { data: wallet } = useQuery<any>({
    queryKey: ["wallet", "summary"],
    queryFn: () => WalletAPI.summary(),
    refetchInterval: 10_000,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });
  const marginAvailable = Number(wallet?.available_balance ?? 0);

  const [subView, setSubView] = useState<SubView>("main");
  const [name, setName] = useState("");
  useEffect(() => {
    if (me?.full_name) setName(me.full_name);
  }, [me?.full_name]);

  // Only a genuinely-logged-out state (no cached user AND nothing fetched)
  // shows the loader / error wall now.
  if (!me && isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!me) return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-sm text-muted-foreground">Could not load profile. Please try again.</p>
      <button
        type="button"
        onClick={() => void refetch()}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Retry
      </button>
    </div>
  );

  // ── Sub-screens ─────────────────────────────────────────────────
  if (subView !== "main") {
    return (
      <SubScreen
        title={subViewTitle(subView)}
        onBack={() => setSubView("main")}
      >
        {subView === "personal" && (
          <PersonalForm
            me={me}
            name={name}
            setName={setName}
            onSave={() => save(name, refetch)}
          />
        )}
        {subView === "security" && <SecurityForm me={me} />}
        {subView === "appearance" && <AppearanceForm />}
        {subView === "support" && <SupportLinks />}
      </SubScreen>
    );
  }

  // ── Main screen (account / "DemoAccount") ──────────────────────
  return (
    <div className="space-y-3 pb-2">
      <ProfileHeader me={me} />

      {/* Margin Available + Withdraw / Add Funds — mirrors the account
          screenshot. Balance reads the shared wallet cache; the buttons
          route to the existing /wallet flows (withdraw form + add-funds
          wizard) so no money logic is duplicated here. */}
      <section className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-buy/12 text-buy">
            <Shield className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Margin Available
            </div>
            <div className="font-tabular text-base font-bold tabular-nums text-buy">
              {formatINR(marginAvailable)}
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {/* Deep-link straight into the deposit / withdraw flow so a single
              tap opens it (no second tap on the wallet page). */}
          <Button asChild variant="outline" className="h-10">
            <Link href="/wallet?open=withdraw">
              <ArrowUp className="size-4" /> Withdraw
            </Link>
          </Button>
          <Button asChild className="h-10">
            <Link href="/wallet?open=deposit">
              <ArrowDown className="size-4" /> Add Funds
            </Link>
          </Button>
        </div>
      </section>

      {/* Password & Security | WhatsApp — two-up quick actions. */}
      <div className="grid grid-cols-2 gap-3">
        <TwoUpCard
          icon={KeyRound}
          tone="primary"
          title="Password & Security"
          sub="Manage"
          onClick={() => setSubView("security")}
        />
        <TwoUpCard
          icon={MessageCircle}
          tone="whatsapp"
          title="WhatsApp"
          sub="Chat with us"
          onClick={() => setSubView("support")}
        />
      </div>

      {/* Settings list — Appearance / Push / Ledger / Margin / Scripts /
          Reports, matching the account screenshot. */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <ul className="divide-y divide-border">
          <SettingRow
            icon={Palette}
            tone="primary"
            title="Appearance"
            sub="Choose light or dark theme"
            right={<InlineThemeToggle />}
          />
          <SettingRow
            icon={Bell}
            tone="warn"
            title="Push notifications"
            sub="Trade alerts and important updates on this device."
            right={<PushToggle />}
          />
          <SettingRowLink
            icon={FileText}
            tone="muted"
            title="Ledger Logs"
            sub="View your transaction history and ledger entries"
            href="/ledger"
          />
          <SettingRowLink
            icon={CreditCard}
            tone="primary"
            title="Margin"
            sub="Your margin and exposure details"
            href="/reports/margin"
          />
          <SettingRowLink
            icon={SlidersHorizontal}
            tone="info"
            title="Scripts Setting"
            sub="Block or manage script trading"
            href="/marketwatch"
          />
          <SettingRowLink
            icon={ReceiptText}
            tone="buy"
            title="Reports"
            sub="Statements and reports in one place"
            href="/reports/pnl"
          />
        </ul>
      </section>

      {/* Two-factor + Personal info kept reachable (not in the screenshot's
          primary list but part of the account). */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <ul className="divide-y divide-border">
          <SettingRow
            icon={UserIcon}
            tone="primary"
            title="Personal information"
            sub="Name, email, mobile, user code"
            right={<ChevronRight className="size-4 text-muted-foreground" />}
            onClick={() => setSubView("personal")}
          />
          <SettingRowLink
            icon={Shield}
            tone={me.two_fa_enabled ? "buy" : "warn"}
            title="Two-factor authentication"
            sub={me.two_fa_enabled ? "Enabled" : "Add a second login step"}
            href="/2fa"
          />
          <SettingRowLink
            icon={Bell}
            tone="warn"
            title="Notifications"
            sub="Alerts, account activity, system"
            href="/notifications"
          />
        </ul>
      </section>

      <SignOutRow />

      <p className="px-1 pb-4 pt-2 text-center text-[10px] text-muted-foreground">
        ProfitX · v1.0.0
      </p>
    </div>
  );
}

function subViewTitle(v: SubView): string {
  switch (v) {
    case "personal":
      return "Personal information";
    case "security":
      return "Security";
    case "appearance":
      return "Appearance";
    case "support":
      return "Help & support";
    default:
      return "Profile";
  }
}

// ─────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────
function ProfileHeader({ me }: { me: any }) {
  const initials = (me.full_name || me.user_code || "U")
    .split(" ")
    .map((s: string) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    // Compact header (operator: "box small kar", "upar id ka gmail mat
    // dikha") — avatar + name + status badges only. Client-id / email line
    // removed.
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative flex items-center gap-3 px-3.5 py-3">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent" />
        <div className="relative grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-sm ring-2 ring-card">
          {initials}
        </div>
        <div className="relative min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-bold leading-tight">{me.full_name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Pill tone={me.status === "ACTIVE" ? "buy" : "muted"}>{me.status}</Pill>
            <Pill tone="primary">{me.role}</Pill>
            {me.is_demo && <Pill tone="warn">DEMO</Pill>}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// List primitives
// ─────────────────────────────────────────────────────────────────
function ListGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border">{children}</ul>
      </div>
    </section>
  );
}

type Tone = "primary" | "buy" | "sell" | "warn" | "info" | "muted";
const TONE_BG: Record<Tone, string> = {
  primary: "bg-primary/12 text-primary",
  buy: "bg-buy/12 text-buy",
  sell: "bg-sell/12 text-sell",
  warn: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  info: "bg-info/12 text-info",
  muted: "bg-muted text-muted-foreground",
};
const BADGE_TONE: Record<Tone, string> = {
  primary: "bg-primary/15 text-primary",
  buy: "bg-buy/15 text-buy",
  sell: "bg-sell/15 text-sell",
  warn: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  info: "bg-info/15 text-info",
  muted: "bg-muted text-muted-foreground",
};

function RowInner({
  icon: Icon,
  tone = "primary",
  label,
  sub,
  badge,
  badgeTone = "muted",
}: {
  icon: any;
  tone?: Tone;
  label: string;
  sub?: string;
  badge?: string | null;
  badgeTone?: Tone;
}) {
  return (
    <>
      <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", TONE_BG[tone])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{label}</div>
        {sub && (
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</div>
        )}
      </div>
      {badge && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            BADGE_TONE[badgeTone],
          )}
        >
          {badge}
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </>
  );
}

function ListRow(props: {
  icon: any;
  tone?: Tone;
  label: string;
  sub?: string;
  badge?: string | null;
  badgeTone?: Tone;
  onClick: () => void;
}) {
  const { onClick, ...rest } = props;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/30 active:bg-muted/50"
      >
        <RowInner {...rest} />
      </button>
    </li>
  );
}

function ListRowLink(props: {
  icon: any;
  tone?: Tone;
  label: string;
  sub?: string;
  badge?: string | null;
  badgeTone?: Tone;
  href: string;
}) {
  const { href, ...rest } = props;
  return (
    <li>
      <Link
        href={href}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/30 active:bg-muted/50"
      >
        <RowInner {...rest} />
      </Link>
    </li>
  );
}

function SignOutRow() {
  const logout = useAuthStore((s) => s.logout);
  async function go() {
    try {
      await logout();
    } finally {
      window.location.href = "/login";
    }
  }
  return (
    <button
      type="button"
      onClick={go}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
    >
      <LogOut className="size-4" />
      Sign out
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// DemoAccount primitives — two-up cards, setting rows, toggles
// ─────────────────────────────────────────────────────────────────
function TwoUpCard({
  icon: Icon,
  tone,
  title,
  sub,
  onClick,
}: {
  icon: any;
  tone: "primary" | "whatsapp";
  title: string;
  sub: string;
  onClick: () => void;
}) {
  const toneCls =
    tone === "whatsapp"
      ? "bg-[#25D366]/15 text-[#25D366]"
      : "bg-primary/12 text-primary";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/30 active:bg-muted/50"
    >
      <div className={cn("grid size-9 place-items-center rounded-xl", toneCls)}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-foreground">{title}</div>
        <div className="truncate text-[11px] text-muted-foreground">{sub}</div>
      </div>
    </button>
  );
}

function SettingRow({
  icon: Icon,
  tone = "primary",
  title,
  sub,
  right,
  onClick,
}: {
  icon: any;
  tone?: Tone;
  title: string;
  sub?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", TONE_BG[tone])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{title}</div>
        {sub && (
          <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{sub}</div>
        )}
      </div>
      {right}
    </>
  );
  if (onClick) {
    return (
      <li>
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/30 active:bg-muted/50"
        >
          {inner}
        </button>
      </li>
    );
  }
  return <li className="flex items-center gap-3 px-3 py-3">{inner}</li>;
}

function SettingRowLink({
  icon: Icon,
  tone = "primary",
  title,
  sub,
  href,
}: {
  icon: any;
  tone?: Tone;
  title: string;
  sub?: string;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/30 active:bg-muted/50"
      >
        <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", TONE_BG[tone])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">{title}</div>
          {sub && (
            <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{sub}</div>
          )}
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}

/** Segmented Light / Dark control (screenshot's Appearance row). Uses the
 *  same next-themes mechanism as ThemeToggle. */
function InlineThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? (resolvedTheme ?? theme) !== "light" : true;
  return (
    <div className="inline-flex shrink-0 rounded-lg border border-border bg-muted/30 p-0.5">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
          !isDark ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
        )}
      >
        <Sun className="size-3.5" /> Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
          isDark ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground",
        )}
      >
        <Moon className="size-3.5" /> Dark
      </button>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onClick,
  disabled,
}: {
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted",
        disabled && "opacity-60",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

/** Push-notification toggle. Reuses `subscribeForWebPush` (VAPID + service
 *  worker) for enable and best-effort unsubscribes on disable. Reflects the
 *  browser permission on mount. */
function PushToggle() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    setOn(Notification.permission === "granted");
  }, []);
  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (!on) {
        if (typeof Notification === "undefined") {
          toast.error("Notifications not supported on this device");
          return;
        }
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          toast.error("Notification permission denied");
          return;
        }
        const { subscribeForWebPush } = await import("@/lib/notify-sound");
        const ok = await subscribeForWebPush();
        setOn(ok);
        if (ok) toast.success("Push notifications enabled");
        else toast.error("Could not enable push notifications");
      } else {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            const endpoint = sub.endpoint;
            await sub.unsubscribe().catch(() => {});
            const { PushAPI } = await import("@/lib/api");
            await PushAPI.unsubscribe(endpoint).catch(() => {});
          }
        } catch {
          // ignore — best effort
        }
        setOn(false);
        toast.success("Push notifications disabled");
      }
    } finally {
      setBusy(false);
    }
  }
  return <ToggleSwitch checked={on} onClick={toggle} disabled={busy} />;
}

// ─────────────────────────────────────────────────────────────────
// Sub-screen frame
// ─────────────────────────────────────────────────────────────────
function SubScreen({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1">
        <button
          type="button"
          onClick={onBack}
          className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted/40"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="text-base font-semibold">{title}</h1>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Personal info form
// ─────────────────────────────────────────────────────────────────
function PersonalForm({
  me,
  name,
  setName,
  onSave,
}: {
  me: any;
  name: string;
  setName: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="space-y-4">
        <Field label="Full name">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
        </Field>
        <ReadRow icon={AtSign} label="Email" value={me.email} />
        <ReadRow icon={Phone} label="Mobile" value={me.mobile} />
        <ReadRow
          icon={IdCard}
          label="User code"
          value={<span className="font-mono">{me.user_code}</span>}
        />
        <div className="grid grid-cols-2 gap-3">
          <Fact label="Account" value={me.is_demo ? "Demo" : "Live"} />
          <Fact label="Role" value={me.role} />
          <Fact
            label="Status"
            value={me.status}
            tone={me.status === "ACTIVE" ? "buy" : "muted"}
          />
          <Fact
            label="2FA"
            value={me.two_fa_enabled ? "Enabled" : "Disabled"}
            tone={me.two_fa_enabled ? "buy" : "muted"}
          />
          {me.last_login_at && (
            <Fact
              label="Last login"
              value={new Date(me.last_login_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              wide
            />
          )}
          {me.created_at && (
            <Fact
              label="Joined"
              value={new Date(me.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              wide
            />
          )}
        </div>
        <div className="pt-1">
          <Button onClick={onSave}>Save changes</Button>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Security form
// ─────────────────────────────────────────────────────────────────
function SecurityForm({ me }: { me: any }) {
  const [pwd, setPwd] = useState({ current_password: "", new_password: "" });
  const [busy, setBusy] = useState(false);

  async function changePassword() {
    if (pwd.new_password.length < 8) return toast.error("Min 8 characters");
    setBusy(true);
    try {
      await AuthAPI.changePassword(pwd);
      toast.success("Password changed");
      setPwd({ current_password: "", new_password: "" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Lock className="size-4 text-primary" /> Change password
        </h3>
        <div className="space-y-3">
          <Field label="Current password">
            <Input
              type="password"
              value={pwd.current_password}
              onChange={(e) =>
                setPwd((p) => ({ ...p, current_password: e.target.value }))
              }
              className="h-11"
            />
          </Field>
          <Field label="New password">
            <Input
              type="password"
              value={pwd.new_password}
              onChange={(e) => setPwd((p) => ({ ...p, new_password: e.target.value }))}
              className="h-11"
            />
            <p className="text-[11px] text-muted-foreground">Minimum 8 characters.</p>
          </Field>
          <Button onClick={changePassword} loading={busy} className="w-full">
            <KeyRound className="size-4" /> Update password
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Shield className="size-4 text-primary" /> Two-factor authentication
        </h3>
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
          <div
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full",
              me.two_fa_enabled ? "bg-buy/15 text-buy" : "bg-muted text-muted-foreground",
            )}
          >
            {me.two_fa_enabled ? (
              <ShieldCheck className="size-5" />
            ) : (
              <ShieldOff className="size-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">
              2FA is {me.two_fa_enabled ? "enabled" : "disabled"}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {me.two_fa_enabled
                ? "Authenticator app is required at login."
                : "Protect your account by requiring a 6-digit code from an authenticator app on every login."}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <Button asChild variant={me.two_fa_enabled ? "outline" : "default"} className="w-full">
            <a href="/2fa">{me.two_fa_enabled ? "Manage 2FA" : "Set up 2FA"}</a>
          </Button>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Appearance + Support
// ─────────────────────────────────────────────────────────────────
function AppearanceForm() {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
            <Palette className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium">Theme</div>
            <p className="text-[11px] text-muted-foreground">
              Switch between light and dark
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </section>
  );
}

function SupportLinks() {
  const { data: support } = useSupportContacts();
  const waUrl = buildWhatsappUrl(
    support?.whatsapp,
    "Hi, I need help with my ProfitX account",
  );
  const mailUrl = buildMailtoUrl(support?.email, {
    subject: "ProfitX support request",
  });
  if (!waUrl && !mailUrl) {
    return (
      <section className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Support channels haven't been configured yet. Please contact your broker.
      </section>
    );
  }
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <ul className="divide-y divide-border">
        {waUrl && (
          <li>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/30"
            >
              <div className="grid size-10 place-items-center rounded-xl bg-[#25D366]/15 text-[#25D366]">
                <MessageCircle className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">WhatsApp support</div>
                <p className="truncate text-[11px] text-muted-foreground">
                  {support?.whatsapp}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </a>
          </li>
        )}
        {mailUrl && (
          <li>
            <a
              href={mailUrl}
              className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/30"
            >
              <div className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
                <Mail className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">Email support</div>
                <p className="truncate text-[11px] text-muted-foreground">
                  {support?.email}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </a>
          </li>
        )}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Save helper + atoms
// ─────────────────────────────────────────────────────────────────
async function save(name: string, refetch: () => any) {
  try {
    await ProfileAPI.update({ full_name: name });
    toast.success("Profile updated");
    refetch();
  } catch (e: any) {
    toast.error(e.message);
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function ReadRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm">{value}</div>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  tone,
  wide,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "buy" | "muted";
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/20 px-3 py-2",
        wide && "col-span-2",
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 text-sm font-semibold",
          tone === "buy" && "text-buy",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "primary" | "buy" | "warn" | "muted";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/15 text-primary",
    buy: "bg-buy/15 text-buy",
    warn: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

