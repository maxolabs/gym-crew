"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseBrowser() {
  if (client) return client;

  const { url, anonKey } = getSupabaseEnv();
  client = createBrowserClient(url, anonKey);
  return client;
}



