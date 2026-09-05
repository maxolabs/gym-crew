"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("auth");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
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
        <CardTitle>{t("setNewPassword")}</CardTitle>
        <CardMeta>
          {ready
            ? t("enterNewPassword")
            : t("common:loading")}
        </CardMeta>
      </div>

      {ready ? (
        <>
          <div className="space-y-2">
            <label htmlFor="new-password" className="text-xs text-muted">
              {t("newPassword")}
            </label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("newPasswordPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-xs text-muted">
              {t("confirmPassword")}
            </label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t("repeatPassword")}
            />
            {confirm && !passwordsMatch ? (
              <p className="text-xs text-red-400">{t("passwordsDontMatch")}</p>
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
                push({ type: "success", message: t("passwordUpdated") });
                router.replace("/groups");
              } catch (e: any) {
                push({ type: "error", message: humanizeError(e) });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? t("updating") : t("updatePassword")}
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">
          {t("resetLinkExpired")}
        </p>
      )}

      <Button variant="ghost" href="/login" className="h-10 px-0 text-sm">
        {t("backToLogin")}
      </Button>
    </Card>
  );
}
