import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type DataMode = "local" | "supabase";

export function resolveDataMode(value: string | undefined): DataMode {
  if (value === "local" || value === "supabase") return value;
  throw new Error(
    "Configuration error: VITE_DATA_MODE must be explicitly set to either 'local' or 'supabase'.",
  );
}

// Validation helper for Supabase configuration (reads dynamically to be testable)
export function validateSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  const mode = resolveDataMode(import.meta.env.VITE_DATA_MODE);

  if (mode === "supabase") {
    if (!url) {
      throw new Error("Missing environment variable VITE_SUPABASE_URL in supabase mode.");
    }
    if (!key) {
      throw new Error("Missing environment variable VITE_SUPABASE_PUBLISHABLE_KEY in supabase mode.");
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error("VITE_SUPABASE_URL must be a valid HTTPS URL in supabase mode.");
    }
    if (parsedUrl.protocol !== "https:") {
      throw new Error("VITE_SUPABASE_URL must be a valid HTTPS URL in supabase mode.");
    }
    const normalizedKey = key.toLowerCase();
    if (normalizedKey.includes("service_role") || normalizedKey.includes("service-role") || normalizedKey.startsWith("sb_secret_")) {
      throw new Error("Security alert: a secret or service_role key cannot be used by the browser.");
    }
    if (key.trim().length < 16) {
      throw new Error("VITE_SUPABASE_PUBLISHABLE_KEY is not a valid publishable key.");
    }
  }
}

// Lazy initialization of the Supabase client
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient(): ReturnType<typeof createClient<Database>> | null {
  const mode = resolveDataMode(import.meta.env.VITE_DATA_MODE);
  if (mode !== "supabase") {
    return null;
  }
  validateSupabaseConfig();
  if (!supabaseInstance) {
    const url = import.meta.env.VITE_SUPABASE_URL || "";
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
    supabaseInstance = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();
export const dataMode = resolveDataMode(import.meta.env.VITE_DATA_MODE);
export const getActiveDataMode = () => resolveDataMode(import.meta.env.VITE_DATA_MODE);
