"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, Copy, CheckCircle2 } from "lucide-react";
import { AuthAPI, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TwoFAEnrollPage() {
  const router = useRouter();
  const [secret, setSecret] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await AuthAPI.twoFASetup();
        setSecret(r.secret);
        setUri(r.provisioning_uri);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not start 2FA setup");
      }
    })();
  }, []);

  async function enable() {
    setBusy(true);
    try {
      await AuthAPI.twoFAEnable(code);
      toast.success("Two-factor authentication enabled");
      router.push("/profile");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  function copySecret() {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("Secret copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5 text-center">
        <h2 className="text-lg font-bold tracking-tight text-white">
          Enable two-factor authentication
        </h2>
        <p className="text-xs text-slate-400">
          Scan the secret with Google Authenticator, Authy, or 1Password and enter the 6-digit code.
        </p>
      </div>

      {secret ? (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Secret Key
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="break-all font-mono text-xs text-white">{secret}</code>
                <button
                  onClick={copySecret}
                  className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400 transition-colors hover:bg-emerald-500/25"
                  aria-label="Copy secret"
                >
                  {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            {uri && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Provisioning URI
                </div>
                <code className="break-all font-mono text-[11px] text-slate-400">{uri}</code>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="code" className="text-xs font-medium text-slate-300">
              6-digit verification code
            </Label>
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="code"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="h-11 rounded-xl border-white/10 bg-white/[0.04] pl-10 text-center font-mono text-lg tracking-[0.5em] text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-white/[0.06]"
              />
            </div>
          </div>

          <Button
            onClick={enable}
            className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-[#10b981] to-[#059669] text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-opacity hover:opacity-95"
            loading={busy}
            disabled={code.length !== 6}
          >
            Verify &amp; enable
          </Button>
        </div>
      ) : (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-sm text-slate-400">Generating secret…</p>
          </div>
        </div>
      )}
    </div>
  );
}
