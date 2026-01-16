import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function POST() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    (headerStore.get("x-forwarded-host")
      ? `${headerStore.get("x-forwarded-proto") ?? "https"}://${headerStore.get(
          "x-forwarded-host"
        )}`
      : headerStore.get("host")
        ? `${headerStore.get("x-forwarded-proto") ?? "http"}://${headerStore.get("host")}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000");
  return NextResponse.redirect(new URL("/login", origin));
}


