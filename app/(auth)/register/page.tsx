"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";

export default function RegisterPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { push } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Card className="space-y-4">
      <div>
        <CardTitle>Create your account</CardTitle>
        <CardMeta>Private app for you + friends. Keep it simple.</CardMeta>
      </div>

      <div className="space-y-2">
        <label htmlFor="register-name" className="text-xs text-muted">Name</label>
        <Input
          id="register-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Max"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="register-email" className="text-xs text-muted">Email</label>
        <Input
          id="register-email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="register-password" className="text-xs text-muted">Password</label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>

      <Button
        size="lg"
        disabled={loading || !name || !email || password.length < 8}
        onClick={async () => {
          try {
            setLoading(true);
            const { error } = await supabase.auth.signUp({
              email,
              password,
              options: { data: { name } }
            });
            if (error) throw error;
            push({
              type: "success",
              message: "Account created. You’re in — creating your profile..."
            });
            router.replace("/groups");
          } catch (e: any) {
            push({ type: "error", message: humanizeError(e) });
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Creating..." : "Create Account"}
      </Button>

      <Button variant="ghost" href="/login" className="h-10 px-0 text-sm">
        Already have an account? Sign in
      </Button>
    </Card>
  );
}



