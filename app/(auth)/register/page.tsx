"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
        message: "Account created successfully!"
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
          <CardTitle>Choose your role</CardTitle>
          <CardMeta>This choice is permanent and cannot be changed.</CardMeta>
        </div>

        <div className="space-y-3">
          <RoleCard
            selected={selectedRole === "USER"}
            onSelect={() => setSelectedRole("USER")}
            icon={<User className="h-6 w-6" />}
            title="I'm a Client"
            description="Join a trainer's group, follow routines, and track your check-ins."
          />
          <RoleCard
            selected={selectedRole === "TRAINER"}
            onSelect={() => setSelectedRole("TRAINER")}
            icon={<Dumbbell className="h-6 w-6" />}
            title="I'm a Trainer"
            description="Create groups, manage clients, upload routines, and track progress."
          />
        </div>

        <Button
          size="lg"
          disabled={!selectedRole}
          onClick={() => setStep("details")}
          className="w-full"
        >
          Continue
        </Button>

        <Button variant="ghost" href="/login" className="h-10 w-full px-0 text-sm">
          Already have an account? Sign in
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
          Back
        </button>
        <CardTitle>Create your account</CardTitle>
        <CardMeta>
          {selectedRole === "TRAINER"
            ? "Set up your trainer account to start managing clients."
            : "Set up your account to join a trainer's group."}
        </CardMeta>
      </div>

      <div className="space-y-2">
        <label htmlFor="register-name" className="text-xs text-muted">
          Name
        </label>
        <Input
          id="register-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="register-email" className="text-xs text-muted">
          Email
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
          Password
        </label>
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
        onClick={handleSignUp}
        className="w-full"
      >
        {loading ? "Creating..." : "Create Account"}
      </Button>

      <Button variant="ghost" href="/login" className="h-10 w-full px-0 text-sm">
        Already have an account? Sign in
      </Button>
    </Card>
  );
}




