import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/external-supabase/auth-middleware";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function assertAdmin(context: any) {
  const email = ((context.claims as { email?: string })?.email)?.toLowerCase();
  if (!email || !adminEmails().includes(email)) {
    throw new Error("Acesso restrito a administradores");
  }
}

const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  price_cents: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
});

export const updatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => UpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    assertAdmin(context);
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { id, ...patch } = data;
    const { error } = await externalAdmin.from("plans").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
