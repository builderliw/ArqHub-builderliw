import { createClient } from "@supabase/supabase-js";

const EXTERNAL_SUPABASE_URL = "https://yknwdpyaevodvonvhadt.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbndkcHlhZXZvZHZvbnZoYWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjIzODgsImV4cCI6MjA5NTg5ODM4OH0.JsWg30cmYRk3P0u1WQyXNFa24CLzAtMf3bT_HTmJyEM";

export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "arqhub.external-supabase.auth",
  },
});

export const EXTERNAL_SUPABASE_PROJECT_URL = EXTERNAL_SUPABASE_URL;

export const supabase = externalSupabase;
