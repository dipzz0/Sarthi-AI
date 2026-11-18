import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { BrandLogo } from "@/components/brand-logo";
import { SplashScreen } from "@/components/splash-screen";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Sarthi AI" },
      {
        name: "description",
        content:
          "Sign in or create your Sarthi AI account to plan Mumbai journeys by voice, save trips and file transport complaints.",
      },
      { property: "og:title", content: "Sign in — Sarthi AI" },
      {
        property: "og:description",
        content: "Access your Mumbai voice travel assistant, saved journeys and complaints.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setVerificationEmail(email);
        toast.success("Account created. Please verify your email from your inbox.");
        const { data } = await supabase.auth.getSession();
        if (data.session) navigate({ to: "/" });
        else return;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.session) throw new Error("Sign-in could not be completed. Please try again.");
        toast.success("Welcome back");
        window.location.assign("/");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setFormError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setFormError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
      if (result.redirected) return;
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw error ?? new Error("Google sign-in could not be completed.");
      window.location.assign("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in is unavailable right now.";
      setFormError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SplashScreen>
    <div className="hero-gradient flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("sarthi:replay-splash"))}
          aria-label="Sarthi AI — replay intro video"
          className="mx-auto mb-6 flex w-fit items-center justify-center rounded-xl transition active:scale-95"
        >
          <BrandLogo />
        </button>

        <div className="surface-panel p-6 sm:p-8">
          {verificationEmail ? (
            <div className="py-4 text-center">
              <MailCheck className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 font-display text-2xl font-semibold">Verify your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a verification link to <span className="font-medium text-foreground">{verificationEmail}</span>.
                Open your inbox and verify your email before signing in.
              </p>
              <Button className="mt-6 w-full" onClick={() => { setVerificationEmail(null); setMode("signin"); }}>
                Continue to sign in
              </Button>
            </div>
          ) : <>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Continue planning your Mumbai journeys."
              : "Free account — saved trips, chat history and complaints."}
          </p>

          <Button variant="soft" className="mt-6 w-full" onClick={google} type="button" disabled={busy}>
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or use email{" "}
            <span className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-4" onSubmit={submit}>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aarav Sharma"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
            {formError ? (
              <p role="alert" className="text-sm text-destructive">{formError}</p>
            ) : null}
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to Sarthi AI?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
          </>}
        </div>
      </div>
    </div>
    </SplashScreen>
  );
}
