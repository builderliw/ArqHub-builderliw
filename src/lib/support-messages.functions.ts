import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/external-supabase/auth-middleware";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const SubmitSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(40).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(2000),
});

const ListSchema = z.object({
  limit: z.number().int().min(1).max(200).default(100),
  status: z.string().max(20).optional(),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "in_progress", "resolved"]),
});

export const submitSupportMessage = createServerFn({ method: "POST" })
  .inputValidator((d) => SubmitSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { error } = await supabaseAdmin.from("support_messages").insert({
      name: data.name,
      email: data.email,
      phone: data.phone && data.phone.length > 0 ? data.phone : null,
      message: data.message,
      status: "new",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSupportMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ListSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const email = ((context.claims as { email?: string })?.email)?.toLowerCase();
    if (!email || !adminEmails().includes(email)) {
      throw new Error("Acesso restrito a administradores");
    }
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    let q = supabaseAdmin
      .from("support_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const updateSupportMessageStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => UpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const email = ((context.claims as { email?: string })?.email)?.toLowerCase();
    if (!email || !adminEmails().includes(email)) {
      throw new Error("Acesso restrito a administradores");
    }
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { error } = await supabaseAdmin
      .from("support_messages")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
