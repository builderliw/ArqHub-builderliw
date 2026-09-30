import { createServerFn } from "@tanstack/react-start";

// Verifies that a Supabase access_token belongs to a user whose email
// matches a row in clients (any office). Uses external service role,
// so it bypasses RLS but requires a valid access_token.
export const checkClientByToken = createServerFn({ method: "POST" })
  .inputValidator((input: { accessToken: string }) => {
    if (!input?.accessToken || typeof input.accessToken !== "string") {
      throw new Error("accessToken obrigatório");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: userData, error: userErr } = await externalAdmin.auth.getUser(data.accessToken);
    if (userErr || !userData?.user?.email) {
      return { ok: false as const, reason: "unauthenticated" };
    }
    const email = userData.user.email.trim();
    const { data: client, error } = await externalAdmin
      .from("clients")
      .select("id")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();
    if (error) return { ok: false as const, reason: "lookup_failed" };
    if (!client) return { ok: false as const, reason: "not_found", email };
    return { ok: true as const, clientId: client.id, email };
  });
