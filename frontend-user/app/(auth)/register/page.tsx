"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBranding } from "@/lib/branding-context";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Eye, EyeOff, X, User, Mail, Phone, Lock, Ticket, ArrowLeft } from "lucide-react";
import { AuthAPI, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(2, "Enter your name").max(128),
  email: z.string().email("Invalid email"),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "10-digit mobile starting 6/7/8/9"),
  password: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/\d/, "Must contain a digit")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character (e.g. @, #, $)"),
  referral_code: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const PWD_RULES = [
  { id: "len", label: "8+ characters", test: (s: string) => s.length >= 8 },
  { id: "upper", label: "Uppercase (A–Z)", test: (s: string) => /[A-Z]/.test(s) },
  { id: "lower", label: "Lowercase (a–z)", test: (s: string) => /[a-z]/.test(s) },
  { id: "digit", label: "Number (0–9)", test: (s: string) => /\d/.test(s) },
  { id: "spec", label: "Special (@ # $)", test: (s: string) => /[^A-Za-z0-9]/.test(s) },
];

const inputCls =
  "h-11 rounded-xl border-white/10 bg-white/[0.04] pl-10 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:bg-white/[0.06]";
const iconCls =
  "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500";
const labelCls = "text-xs font-medium text-slate-300";

function strengthScore(pwd: string): number {
  return PWD_RULES.reduce((n, r) => n + (r.test(pwd) ? 1 : 0), 0);
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageInner />
    </Suspense>
  );
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = (searchParams?.get("ref") || "").trim().toUpperCase();
  const { branding } = useBranding();
  const [showPwd, setShowPwd] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      mobile: "",
      password: "",
      referral_code: refCode || "",
    },
    mode: "onChange",
  });

  const pwd = form.watch("password") || "";
  const score = strengthScore(pwd);
  const showRules = pwdFocused || pwd.length > 0;

  async function onSubmit(values: FormValues) {
    try {
      await AuthAPI.register({
        full_name: values.full_name,
        email: values.email,
        mobile: values.mobile,
        password: values.password,
        referral_code:
          (values.referral_code || "").trim() ||
          refCode ||
          branding?.user_code ||
          undefined,
      });
      toast.success("Account created. Please sign in.");
      router.push(refCode ? `/login?ref=${encodeURIComponent(refCode)}` : "/login");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Registration failed";
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
        {/* Account Name */}
        <div className="space-y-1.5">
          <Label htmlFor="full_name" className={labelCls}>
            Account Name
          </Label>
          <div className="relative">
            <User className={iconCls} />
            <Input
              id="full_name"
              placeholder="Your Name"
              autoComplete="name"
              className={inputCls}
              {...form.register("full_name")}
            />
          </div>
          {form.formState.errors.full_name && (
            <p className="text-xs text-red-400">{form.formState.errors.full_name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className={labelCls}>
            Email
          </Label>
          <div className="relative">
            <Mail className={iconCls} />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className={inputCls}
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Mobile */}
        <div className="space-y-1.5">
          <Label htmlFor="mobile" className={labelCls}>
            Mobile
          </Label>
          <div className="relative">
            <Phone className={iconCls} />
            <Input
              id="mobile"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              placeholder="Mobile Number"
              className={inputCls}
              {...form.register("mobile")}
            />
          </div>
          {form.formState.errors.mobile && (
            <p className="text-xs text-red-400">{form.formState.errors.mobile.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className={labelCls}>
            Password
          </Label>
          <div className="relative">
            <Lock className={iconCls} />
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              placeholder="Min 8 Character Password"
              autoComplete="new-password"
              className={`${inputCls} pr-11`}
              {...form.register("password", { onBlur: () => setPwdFocused(false) })}
              onFocus={() => setPwdFocused(true)}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Hide password" : "Show password"}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition-colors hover:text-slate-300"
            >
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {/* Strength bar */}
          {pwd && (
            <div className="flex gap-1.5" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    i < score
                      ? score <= 2
                        ? "bg-red-500"
                        : score <= 4
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                      : "bg-white/10",
                  )}
                />
              ))}
            </div>
          )}

          {/* Rules checklist */}
          {showRules && (
            <ul className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3" aria-live="polite">
              {PWD_RULES.map((r) => {
                const ok = r.test(pwd);
                return (
                  <li
                    key={r.id}
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] transition-colors",
                      ok ? "text-emerald-400" : "text-slate-500",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-3.5 shrink-0 place-items-center rounded-full",
                        ok ? "bg-emerald-500/15" : "bg-white/5",
                      )}
                    >
                      {ok ? (
                        <Check className="size-2" strokeWidth={3} />
                      ) : (
                        <X className="size-2" strokeWidth={3} />
                      )}
                    </span>
                    <span className="leading-tight">{r.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {form.formState.errors.password && !showRules && (
            <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
          )}
        </div>

        {/* Referral Code */}
        <div className="space-y-1.5">
          <Label htmlFor="referral_code" className={labelCls}>
            Referral Code
          </Label>
          <div className="relative">
            <Ticket className={iconCls} />
            <Input
              id="referral_code"
              placeholder="Enter referral code"
              autoCapitalize="characters"
              className={inputCls}
              {...form.register("referral_code")}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-[#10b981] to-[#059669] text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-opacity hover:opacity-95"
          loading={form.formState.isSubmitting}
        >
          Register
        </Button>
      </form>

      <Link
        href="/login"
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.07] active:scale-[0.99]"
      >
        <ArrowLeft className="size-4" />
        Back to Login
      </Link>
    </div>
  );
}
