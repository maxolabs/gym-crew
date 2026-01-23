"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";

export default function UpdatePasswordPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { push } = useToast();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check if we have a valid session from the reset link
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    // Also check current session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      }
    });
  }, [supabase.auth]);

  const passwordsMatch = password === confirm;
  const isValid = password.length >= 6 && passwordsMatch;

  return (
    <Card className="space-y-4">
      <div>
        <CardTitle>Set new password</CardTitle>
        <CardMeta>
          {ready
            ? "Enter your new password below."
            : "Loading..."}
        </CardMeta>
      </div>

      {ready ? (
        <>
          <div className="space-y-2">
            <label htmlFor="new-password" className="text-xs text-muted">
              New password
            </label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-xs text-muted">
              Confirm password
            </label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
            />
            {confirm && !passwordsMatch ? (
              <p className="text-xs text-red-400">Passwords don&apos;t match</p>
            ) : null}
          </div>

          <Button
            size="lg"
            disabled={loading || !isValid}
            onClick={async () => {
              try {
                setLoading(true);
                const { error } = await supabase.auth.updateUser({
                  password
                });
                if (error) throw error;
                push({ type: "success", message: "Password updated!" });
                router.replace("/groups");
              } catch (e: any) {
                push({ type: "error", message: humanizeError(e) });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Updating..." : "Update password"}
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">
          If this page doesn&apos;t load, your reset link may have expired.
        </p>
      )}

      <Button variant="ghost" href="/login" className="h-10 px-0 text-sm">
        Back to login
      </Button>
    </Card>
  );
}
