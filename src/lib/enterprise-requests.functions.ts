import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/external-supabase/auth-middleware";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const ListSchema = z.object({
  limit: z.number().int().min(1).max(200).default(100),
  status: z.string().max(20).optional(),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "contacted", "won", "lost"]),
});

export const listEnterpriseRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ListSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const email = ((context.claims as { email?: string })?.email)?.toLowerCase();
    if (!email || !adminEmails().includes(email)) {
      throw new Error("Acesso restrito a administradores");
    }
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    let q = supabaseAdmin
      .from("enterprise_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const updateEnterpriseRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => UpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const email = ((context.claims as { email?: string })?.email)?.toLowerCase();
    if (!email || !adminEmails().includes(email)) {
      throw new Error("Acesso restrito a administradores");
    }
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { error } = await supabaseAdmin
      .from("enterprise_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
