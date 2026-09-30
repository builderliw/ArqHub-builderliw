import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Schema = z.object({
  accessToken: z.string().min(10),
  limit: z.number().int().min(1).max(50000).default(50000),
});

export const listAllAppLogs = createServerFn({ method: "POST" })
  .inputValidator((input) => Schema.parse(input))
  .handler(async ({ data }) => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    const admin = await assertAdminByToken(data.accessToken);
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: rows, error } = await externalAdmin
      .from("app_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    const email = (admin.email ?? "").toLowerCase();
    // Nunca expor a atividade do próprio administrador
    const filtered = ((rows ?? []) as any[]).filter((r) => {
      if (r.user_id && r.user_id === admin.userId) return false;
      if (email && (r.user_email ?? "").toLowerCase() === email) return false;
      return true;
    });
    return { rows: filtered };
  });
