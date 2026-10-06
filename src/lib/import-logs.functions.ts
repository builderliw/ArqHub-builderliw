import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LogEntry = z.object({
  created_at: z.string().optional(),
  level: z.enum(["debug", "info", "warn", "error", "audit"]).optional(),
  source: z.enum(["client", "server", "webhook", "db"]).optional(),
  screen: z.string().max(200).nullable().optional(),
  route: z.string().max(500).nullable().optional(),
  action: z.string().max(200).nullable().optional(),
  message: z.string().max(4000),
  details: z.record(z.any()).nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  user_email: z.string().email().max(320).nullable().optional(),
  office_id: z.string().uuid().nullable().optional(),
  user_agent: z.string().max(1000).nullable().optional(),
  ip: z.string().max(64).nullable().optional(),
});

const Schema = z.object({
  accessToken: z.string().min(10),
  entries: z.array(LogEntry).min(1).max(5000),
  source: z.enum(["client", "server", "webhook", "db"]).default("server"),
});

export const importLogsFn = createServerFn({ method: "POST" })
  .inputValidator((input) => Schema.parse(input))
  .handler(async ({ data }) => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");

    const rows = data.entries.map((e) => ({
      created_at: e.created_at ?? new Date().toISOString(),
      level: e.level ?? "info",
      source: e.source ?? data.source,
      screen: e.screen ?? null,
      route: e.route ?? null,
      action: e.action ?? null,
      message: e.message.slice(0, 4000),
      details: { ...(e.details ?? {}), imported: true },
      user_id: e.user_id ?? null,
      user_email: e.user_email ?? null,
      office_id: e.office_id ?? null,
      user_agent: e.user_agent ?? null,
      ip: e.ip ?? null,
    }));

    // insert in chunks of 500
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error, count } = await externalAdmin
        .from("app_logs" as any)
        .insert(chunk, { count: "exact" });
      if (error) throw new Error(error.message);
      inserted += count ?? chunk.length;
    }
    return { inserted };
  });
