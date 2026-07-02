import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Validation helper for Supabase configuration (reads dynamically to be testable)
export function validateSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  const mode = import.meta.env.VITE_DATA_MODE || "local";

  if (mode === "supabase") {
    if (!url) {
      throw new Error("Missing environment variable VITE_SUPABASE_URL in supabase mode.");
    }
    if (!key) {
      throw new Error("Missing environment variable VITE_SUPABASE_PUBLISHABLE_KEY in supabase mode.");
    }
    if (key.includes("service_role") || key.length > 200 && key.toLowerCase().includes("service")) {
      throw new Error("Security Alert: Exposing service_role key on the client is prohibited.");
    }
  }
}

// Lazy initialization of the Supabase client
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient(): ReturnType<typeof createClient<Database>> | null {
  const mode = import.meta.env.VITE_DATA_MODE || "local";
  if (mode !== "supabase") {
    return null;
  }
  validateSupabaseConfig();
  if (!supabaseInstance) {
    const url = import.meta.env.VITE_SUPABASE_URL || "";
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";
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
export const dataMode = import.meta.env.VITE_DATA_MODE || "local";
export const getActiveDataMode = () => import.meta.env.VITE_DATA_MODE || "local";
