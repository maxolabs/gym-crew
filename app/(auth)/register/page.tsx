"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RoleCard } from "@/components/ui/RoleCard";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/components/ui/Toast";
import { humanizeError } from "@/lib/errors";
import { User, Dumbbell, ArrowLeft } from "lucide-react";
import type { UserType } from "@/lib/supabase/types";

type Step = "role" | "details";

export default function RegisterPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { push } = useToast();
  const { t } = useTranslation(["auth", "common"]);

  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!selectedRole) return;

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            user_type: selectedRole
          }
        }
      });
      if (error) throw error;

      push({
        type: "success",
        message: t("auth:accountCreated")
      });

      if (selectedRole === "TRAINER") {
        router.replace("/trainer");
      } else {
        router.replace("/dashboard");
      }
    } catch (e: unknown) {
      push({ type: "error", message: humanizeError(e) });
    } finally {
      setLoading(false);
    }
  }

  if (step === "role") {
    return (
      <Card className="space-y-6">
        <div>
          <CardTitle>{t("auth:chooseRole")}</CardTitle>
          <CardMeta>{t("auth:rolePermanent")}</CardMeta>
        </div>

        <div className="space-y-3">
          <RoleCard
            selected={selectedRole === "USER"}
            onSelect={() => setSelectedRole("USER")}
            icon={<User className="h-6 w-6" />}
            title={t("auth:imClient")}
            description={t("auth:clientRoleDesc")}
          />
          <RoleCard
            selected={selectedRole === "TRAINER"}
            onSelect={() => setSelectedRole("TRAINER")}
            icon={<Dumbbell className="h-6 w-6" />}
            title={t("auth:imTrainer")}
            description={t("auth:trainerRoleDesc")}
          />
        </div>

        <Button
          size="lg"
          disabled={!selectedRole}
          onClick={() => setStep("details")}
          className="w-full"
        >
          {t("common:continue")}
        </Button>

        <Button variant="ghost" href="/login" className="h-10 w-full px-0 text-sm">
          {t("auth:alreadyHaveAccount")}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div>
        <button
          onClick={() => setStep("role")}
          className="mb-2 flex items-center gap-1 text-sm text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common:back")}
        </button>
        <CardTitle>{t("auth:createYourAccount")}</CardTitle>
        <CardMeta>
          {selectedRole === "TRAINER"
            ? t("auth:trainerAccountSetup")
            : t("auth:clientAccountSetup")}
        </CardMeta>
      </div>

      <div className="space-y-2">
        <label htmlFor="register-name" className="text-xs text-muted">
          {t("auth:nameLabel")}
        </label>
        <Input
          id="register-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("auth:namePlaceholder")}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="register-email" className="text-xs text-muted">
          {t("auth:emailLabel")}
        </label>
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
        <label htmlFor="register-password" className="text-xs text-muted">
          {t("auth:passwordLabel")}
        </label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth:passwordPlaceholder")}
        />
      </div>

      <Button
        size="lg"
        disabled={loading || !name || !email || password.length < 8}
        onClick={handleSignUp}
        className="w-full"
      >
        {loading ? t("auth:creating") : t("auth:createAccountBtn")}
      </Button>

      <Button variant="ghost" href="/login" className="h-10 w-full px-0 text-sm">
        {t("auth:alreadyHaveAccount")}
      </Button>
    </Card>
  );
}
