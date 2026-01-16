"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function LogoutButton() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="secondary"
      disabled={loading}
      onClick={async () => {
        try {
          setLoading(true);
          await supabase.auth.signOut();
          router.replace("/login");
          router.refresh();
        } catch {
          // Even if signOut fails, redirect to login
          router.replace("/login");
        }
      }}
    >
      {loading ? "..." : "Logout"}
    </Button>
  );
}
