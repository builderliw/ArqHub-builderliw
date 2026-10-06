// Auth middleware validating tokens against the ArqHub Supabase project.
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

const EXTERNAL_SUPABASE_URL = "https://yknwdpyaevodvonvhadt.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbndkcHlhZXZvZHZvbnZoYWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjIzODgsImV4cCI6MjA5NTg5ODM4OH0.JsWg30cmYRk3P0u1WQyXNFa24CLzAtMf3bT_HTmJyEM";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    const authHeader = request?.headers?.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Unauthorized: No authorization header provided");
    }
    const token = authHeader.slice("Bearer ".length);
    if (!token) throw new Error("Unauthorized: No token provided");

    const supabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) throw new Error("Unauthorized: Invalid token");

    return next({
      context: {
        supabase,
        userId: data.user.id,
        claims: { sub: data.user.id, email: data.user.email } as Record<string, unknown>,
      },
    });
  },
);
