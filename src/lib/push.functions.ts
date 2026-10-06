import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const EXTERNAL_URL = "https://yknwdpyaevodvonvhadt.supabase.co";

// Antes apontava para o banco Lovable Cloud; agora usa o mesmo projeto yknwdpyaevodvonvhadt.
function lov() {
  const srk = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;
  if (!srk) throw new Error("server_misconfigured");
  return createClient(EXTERNAL_URL, srk, { auth: { persistSession: false } });
}

async function emailFromExternalToken(token: string): Promise<string | null> {
  const srk = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;
  if (!srk) return null;
  const ext = createClient(EXTERNAL_URL, srk, { auth: { persistSession: false } });
  const { data } = await ext.auth.getUser(token);
  return data?.user?.email?.toLowerCase() ?? null;
}

const SubSchema = z.object({
  externalAccessToken: z.string().min(10).max(4096),
  endpoint: z.string().url().min(1).max(2048),
  p256dh: z.string().min(1).max(512),
  auth: z.string().min(1).max(512),
  userAgent: z.string().max(512).optional().nullable(),
});

export const subscribePush = createServerFn({ method: "POST" })
  .inputValidator((d) => SubSchema.parse(d))
  .handler(async ({ data }) => {
    const email = await emailFromExternalToken(data.externalAccessToken);
    if (!email) return { ok: false as const, reason: "unauthorized" as const };
    const db = lov();
    const { error } = await db.from("push_subscriptions").upsert(
      {
        user_email: email,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    if (error) return { ok: false as const, reason: "db_error" as const, error: error.message };
    return { ok: true as const };
  });

const UnsubSchema = z.object({
  externalAccessToken: z.string().min(10).max(4096),
  endpoint: z.string().url().min(1).max(2048),
});

export const unsubscribePush = createServerFn({ method: "POST" })
  .inputValidator((d) => UnsubSchema.parse(d))
  .handler(async ({ data }) => {
    const email = await emailFromExternalToken(data.externalAccessToken);
    if (!email) return { ok: false as const };
    const db = lov();
    await db.from("push_subscriptions").delete()
      .eq("endpoint", data.endpoint)
      .eq("user_email", email);
    return { ok: true as const };
  });
