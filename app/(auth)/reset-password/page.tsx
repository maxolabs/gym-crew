"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";

export default function ResetPasswordPage() {
  const supabase = supabaseBrowser();
  const { push } = useToast();
  const { t } = useTranslation("auth");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <Card className="space-y-4">
      <div>
        <CardTitle>{t("resetPassword")}</CardTitle>
        <CardMeta>
          {sent
            ? t("resetSent")
            : t("resetInstructions")}
        </CardMeta>
      </div>

      {!sent ? (
        <>
          <div className="space-y-2">
            <label htmlFor="reset-email" className="text-xs text-muted">
              {t("emailLabel")}
            </label>
            <Input
              id="reset-email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <Button
            size="lg"
            disabled={loading || !email}
            onClick={async () => {
              try {
                setLoading(true);
                const { error } = await supabase.auth.resetPasswordForEmail(
                  email,
                  {
                    redirectTo: `${window.location.origin}/update-password`
                  }
                );
                if (error) throw error;
                setSent(true);
                push({ type: "success", message: t("resetLinkSent") });
              } catch (e: any) {
                push({ type: "error", message: humanizeError(e) });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? t("sending") : t("sendResetLink")}
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">
          {t("checkSpam")}
        </p>
      )}

      <Button variant="ghost" href="/login" className="h-10 px-0 text-sm">
        {t("backToLogin")}
      </Button>
    </Card>
  );
}
