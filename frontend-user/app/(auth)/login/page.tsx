"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
  ShieldCheck,
  Zap,
  UserPlus,
  Download,
  MessageCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { ApiError, AuthAPI, ProfileAPI, setTokens } from "@/lib/api";
import { STORAGE_KEYS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// TODO: replace these with your real links (WhatsApp support number + app URL).
const WHATSAPP_URL = "https://wa.me/910000000000";
const DOWNLOAD_URL = "/download";

const schema = z.object({
  identifier: z.string().min(3, "Enter your Userid"),
  password: z.string().min(6, "Enter your password"),
  two_fa_code: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const inputCls =
  "h-11 rounded-xl border-white/10 bg-white/[0.04] pl-10 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:bg-white/[0.06]";
const iconCls =
  "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500";
const labelCls = "text-xs font-medium text-slate-300";
const outlineBtn =
  "flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.07] active:scale-[0.99]";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSplash subtitle="Loading…" />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginSplash({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500/10">
        <Loader2 className="size-5 animate-spin text-emerald-400" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">Signing you in…</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const setUser = useAuthStore((s) => s.setUser);
  const hydrated = useAuthStore((s) => s.hydrated);
  const currentUser = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const [showPwd, setShowPwd] = useState(false);
  const [needs2fa, setNeeds2fa] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (!hydrated || !currentUser) return;
    const hasRefresh =
      typeof window !== "undefined" &&
      !!window.localStorage.getItem(STORAGE_KEYS.refreshToken);
    if (hasRefresh) {
      router.replace("/marketwatch");
    } else {
      try {
        window.localStorage.removeItem("nb.auth");
      } catch {
        /* ignore */
      }
      setUser(null);
    }
  }, [hydrated, currentUser, router, setUser]);

  const impAccess = searchParams?.get("access");
  const impRefresh = searchParams?.get("refresh");
  const isImpersonating = !!(impAccess && impRefresh);
  const [impersonationFailed, setImpersonationFailed] = useState(false);

  useEffect(() => {
    if (!isImpersonating || !impAccess || !impRefresh) return;
    setTokens(impAccess, impRefresh);
    router.prefetch("/marketwatch");
    ProfileAPI.me()
      .then((u: any) => {
        setUser(u as any);
        router.replace("/marketwatch");
      })
      .catch(() => {
        toast.error("Impersonation token rejected");
        setImpersonationFailed(true);
      });
  }, [isImpersonating, impAccess, impRefresh, router, setUser]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "", two_fa_code: "" },
  });

  async function handleDemoLogin() {
    setDemoLoading(true);
    try {
      const pair = await AuthAPI.demoLogin();
      setSession(pair as any);
      toast.success("Demo account ready — ₹50,00,000 virtual balance");
      router.push("/marketwatch");
    } catch {
      toast.error("Could not start demo. Please try again.");
    } finally {
      setDemoLoading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      await login(values.identifier, values.password, values.two_fa_code || undefined);
      toast.success("Welcome back");
      router.push("/marketwatch");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "TWO_FA_REQUIRED") {
          setNeeds2fa(true);
          toast.info("Enter your 2FA code to continue");
          return;
        }
        toast.error(err.message);
      } else {
        toast.error("Login failed. Please try again.");
      }
    }
  }

  if (isImpersonating && !impersonationFailed) {
    return <LoginSplash subtitle="Redirecting to your dashboard" />;
  }
  if (!hydrated) {
    return <LoginSplash subtitle="Restoring your session…" />;
  }
  if (currentUser) {
    return <LoginSplash subtitle="Redirecting to your dashboard" />;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
        {/* Userid */}
        <div className="space-y-1.5">
          <Label htmlFor="identifier" className={labelCls}>
            Userid
          </Label>
          <div className="relative">
            <User className={iconCls} />
            <Input
              id="identifier"
              placeholder="Enter your Userid"
              autoComplete="username"
              className={inputCls}
              {...form.register("identifier")}
            />
          </div>
          {form.formState.errors.identifier && (
            <p className="text-xs text-red-400">{form.formState.errors.identifier.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className={labelCls}>
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className={iconCls} />
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={`${inputCls} pr-11`}
              {...form.register("password")}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition-colors hover:text-slate-300"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
          )}
        </div>

        {needs2fa && (
          <div className="space-y-1.5">
            <Label htmlFor="two_fa_code" className={labelCls}>
              2FA Code
            </Label>
            <div className="relative">
              <ShieldCheck className={iconCls} />
              <Input
                id="two_fa_code"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                autoComplete="one-time-code"
                className={inputCls}
                {...form.register("two_fa_code")}
              />
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-[#10b981] to-[#059669] text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-opacity hover:opacity-95"
          loading={form.formState.isSubmitting}
        >
          Login
        </Button>
      </form>

      {/* Button stack */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={demoLoading}
          className={`${outlineBtn} disabled:pointer-events-none disabled:opacity-60`}
        >
          {demoLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Zap className="size-4 text-emerald-400" />
          )}
          {demoLoading ? "Setting up demo…" : "Demo Login"}
        </button>

        <Link href="/register" className={outlineBtn}>
          <UserPlus className="size-4 text-emerald-400" />
          Create Account
        </Link>

        <Link href={DOWNLOAD_URL} className={outlineBtn}>
          <Download className="size-4 text-sky-400" />
          Download ProfitX App
        </Link>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={outlineBtn}
        >
          <MessageCircle className="size-4 text-green-400" />
          WhatsApp Support
        </a>
      </div>

      <p className="px-2 pt-2 text-center text-[11px] leading-relaxed text-slate-500">
        Trade Indian stocks, F&amp;O, commodities, currencies and crypto — real-time
        market data, pro tools and a risk-free demo, anytime, anywhere.
      </p>
    </div>
  );
}
