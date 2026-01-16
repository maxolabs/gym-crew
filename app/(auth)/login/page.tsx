"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";

function getSafeRedirect(next: string | null): string {
  if (!next) return "/groups";
  // Prevent open redirect: must start with / and not be protocol-relative
  if (next.startsWith("/") && !next.startsWith("//") && !next.includes("://")) {
    return next;
  }
  return "/groups";
}

function LoginForm() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const next = getSafeRedirect(useSearchParams().get("next"));
  const { push } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Card className="space-y-4">
      <div>
        <CardTitle>Welcome back</CardTitle>
        <CardMeta>Sign in to check in with your crew.</CardMeta>
      </div>

      <div className="space-y-2">
        <label htmlFor="login-email" className="text-xs text-muted">Email</label>
        <Input
          id="login-email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="login-password" className="text-xs text-muted">Password</label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <Button
        size="lg"
        disabled={loading || !email || !password}
        onClick={async () => {
          try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            if (error) throw error;
            router.replace(next);
          } catch (e: any) {
            push({ type: "error", message: humanizeError(e) });
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Signing in..." : "Sign In"}
      </Button>

      <div className="flex items-center justify-between">
        <Button variant="ghost" href="/register" className="h-10 px-0 text-sm">
          Create account
        </Button>
        <Button
          variant="ghost"
          className="h-10 px-0 text-sm text-muted"
          onClick={() =>
            push({
              type: "info",
              message:
                "If you forgot your password, we can add reset later (kept out for now)."
            })
          }
        >
          Forgot?
        </Button>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Card className="space-y-4"><CardTitle>Loading...</CardTitle></Card>}>
      <LoginForm />
    </Suspense>
  );
}



