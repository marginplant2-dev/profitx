"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, KeyRound, Lock, ArrowLeft } from "lucide-react";
import { AuthAPI, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const requestSchema = z.object({ identifier: z.string().min(3) });
const resetSchema = z.object({
  identifier: z.string().min(3),
  otp: z.string().min(4).max(8),
  new_password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/\d/),
});

const inputCls =
  "h-11 rounded-xl border-white/10 bg-white/[0.04] pl-10 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:bg-white/[0.06]";
const iconCls =
  "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500";
const labelCls = "text-xs font-medium text-slate-300";
const primaryBtn =
  "h-11 w-full rounded-xl border-0 bg-gradient-to-r from-[#10b981] to-[#059669] text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-opacity hover:opacity-95";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [identifier, setIdentifier] = useState("");

  const requestForm = useForm({ resolver: zodResolver(requestSchema), defaultValues: { identifier: "" } });
  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { identifier: "", otp: "", new_password: "" },
  });

  async function onRequest(v: { identifier: string }) {
    try {
      await AuthAPI.forgotPassword(v.identifier);
      toast.success("If the account exists, a reset code was sent.");
      setIdentifier(v.identifier);
      resetForm.setValue("identifier", v.identifier);
      setStep("reset");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send reset code");
    }
  }

  async function onReset(v: { identifier: string; otp: string; new_password: string }) {
    try {
      await AuthAPI.resetPassword(v);
      toast.success("Password updated. Please sign in.");
      window.location.href = "/login";
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Reset failed");
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5 text-center">
        <h2 className="text-lg font-bold tracking-tight text-white">Forgot password</h2>
        <p className="text-xs text-slate-400">
          {step === "request"
            ? "Enter your Userid / email / mobile and we'll send a reset code."
            : `Enter the code sent to ${identifier} and choose a new password.`}
        </p>
      </div>

      {step === "request" ? (
        <form onSubmit={requestForm.handleSubmit(onRequest)} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="identifier" className={labelCls}>Userid / Email / Mobile</Label>
            <div className="relative">
              <Mail className={iconCls} />
              <Input
                id="identifier"
                placeholder="Enter your Userid"
                className={inputCls}
                {...requestForm.register("identifier")}
              />
            </div>
          </div>
          <Button type="submit" className={primaryBtn} loading={requestForm.formState.isSubmitting}>
            Send reset code
          </Button>
        </form>
      ) : (
        <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="otp" className={labelCls}>Reset code</Label>
            <div className="relative">
              <KeyRound className={iconCls} />
              <Input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit code"
                className={inputCls}
                {...resetForm.register("otp")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new_password" className={labelCls}>New password</Label>
            <div className="relative">
              <Lock className={iconCls} />
              <Input
                id="new_password"
                type="password"
                placeholder="Enter new password"
                className={inputCls}
                {...resetForm.register("new_password")}
              />
            </div>
          </div>
          <Button type="submit" className={primaryBtn} loading={resetForm.formState.isSubmitting}>
            Reset password
          </Button>
        </form>
      )}

      <Link
        href="/login"
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.07]"
      >
        <ArrowLeft className="size-4" />
        Back to Login
      </Link>
    </div>
  );
}
