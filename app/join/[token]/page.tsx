"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { push } = useToast();
  const { t } = useTranslation("auth");

  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setAuthed(!!data.user);
      setLoading(false);
    })();
  }, [supabase]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-3 py-10">
        <Card className="w-full space-y-2">
          <CardTitle>{t("joiningTitle")}</CardTitle>
          <CardMeta>{t("checkingSession")}</CardMeta>
        </Card>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-3 py-10">
        <Card className="w-full space-y-3">
          <CardTitle>{t("signInToJoin")}</CardTitle>
          <CardMeta>{t("inviteRequiresAccount")}</CardMeta>
          <Button href={`/login?next=${encodeURIComponent(`/join/${token}`)}`} size="lg">
            {t("signIn")}
          </Button>
          <Button href="/register" variant="secondary" size="lg">
            {t("createAccount")}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-3 py-10">
      <Card className="w-full space-y-3">
        <CardTitle>{t("joinThisGroup")}</CardTitle>
        <CardMeta>{t("wellAddYou")}</CardMeta>
        <Button
          size="lg"
          onClick={async () => {
            try {
              setLoading(true);
              const { data, error } = await supabase.rpc("join_group_with_token", {
                p_token: token
              });
              if (error) throw error;
              const groupId = data as string;
              window.localStorage.setItem("gymcrew:lastGroupId", groupId);
              push({ type: "success", message: t("joined") });
              router.replace(`/g/${groupId}`);
            } catch (e: any) {
              push({ type: "error", message: humanizeError(e) });
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
        >
          {loading ? t("joining") : t("joinGroup")}
        </Button>
        <Button href="/groups" variant="ghost" className="h-10 px-0 text-sm">
          {t("common:cancel")}
        </Button>
      </Card>
    </div>
  );
}
