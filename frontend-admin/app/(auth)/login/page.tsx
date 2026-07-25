"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { useAdminAuthStore } from "@/stores/authStore";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfitXMark } from "@/components/common/ProfitXLogo";
import { InstallPWAButton } from "@/components/pwa/InstallPWAButton";

const schema = z.object({
  identifier: z.string().min(3, "Enter your admin email or user code"),
  password: z.string().min(8, "Minimum 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminAuthStore((s) => s.login);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      await login(values.identifier, values.password);
      toast.success("Authenticated");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Login failed");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center space-y-3 text-center">
          <div className="mb-1 flex flex-col items-center gap-3">
            <div className="rounded-2xl shadow-lg shadow-blue-500/25">
              <ProfitXMark className="size-16" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              Profit<span className="text-primary">X</span>
              <span className="ml-1.5 text-muted-foreground">Admin</span>
            </h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md bg-destructive/10 px-2 py-1 text-xs uppercase tracking-wider text-destructive">
            <ShieldCheck className="size-3" />
            Restricted access · Admin only
          </div>
          <CardTitle className="text-2xl">Super Admin Login</CardTitle>
          <CardDescription>
            ProfitX control panel — sign in with your admin credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Admin email or user code</Label>
              <Input id="identifier" autoComplete="username" {...form.register("identifier")} />
              {form.formState.errors.identifier && (
                <p className="text-xs text-destructive">{form.formState.errors.identifier.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
              Sign in
            </Button>
            <p className="text-xs text-muted-foreground">
              Activity is logged. IP allow-listing and rate-limiting are enforced server-side.
            </p>
          </form>

          {/* Install web app — sits below the form so it doesn't compete
              with the primary "Sign in" CTA. Only renders a real button
              when the browser actually supports install (Chromium fires
              `beforeinstallprompt`) or when the visitor is on iOS where
              we surface a manual "Add to Home Screen" walkthrough. */}
          <div className="mt-5 space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold">Install MP Admin app</div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  One-tap home-screen launcher. Stays signed in like a native app.
                </p>
              </div>
            </div>
            <InstallPWAButton />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
