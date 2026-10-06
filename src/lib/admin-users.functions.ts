import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ResetTrialSchema = z.object({
  accessToken: z.string().min(10),
  userId: z.string().uuid(),
  days: z.number().int().min(1).max(90).default(14),
});

export const resetUserTrial = createServerFn({ method: "POST" })
  .inputValidator((d) => ResetTrialSchema.parse(d))
  .handler(async ({ data }) => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");

    const { data: office, error: findErr } = await externalAdmin
      .from("offices")
      .select("id")
      .eq("owner_id", data.userId)
      .maybeSingle();
    if (findErr) throw new Error(findErr.message);
    if (!office) throw new Error("Usuário não possui escritório próprio.");

    const trialExpiresAt = new Date(Date.now() + data.days * 24 * 60 * 60 * 1000).toISOString();

    const { error: updErr } = await externalAdmin
      .from("offices")
      .update({ status: "trial", trial_expires_at: trialExpiresAt })
      .eq("id", (office as { id: string }).id);
    if (updErr) throw new Error(updErr.message);

    // Cancela assinaturas ativas para não conflitar com o trial re-aberto.
    await externalAdmin
      .from("subscriptions")
      .update({ status: "canceled" })
      .eq("office_id", (office as { id: string }).id)
      .eq("status", "active");

    return { ok: true, trialExpiresAt };
  });

const GrantPlanSchema = z.object({
  accessToken: z.string().min(10),
  userId: z.string().uuid(),
  planCode: z.enum(["basico", "premium", "enterprise", "none"]),
  months: z.number().int().min(1).max(36).default(12),
});

export const grantUserPlan = createServerFn({ method: "POST" })
  .inputValidator((d) => GrantPlanSchema.parse(d))
  .handler(async ({ data }) => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");

    const { data: office, error: findErr } = await externalAdmin
      .from("offices")
      .select("id")
      .eq("owner_id", data.userId)
      .maybeSingle();
    if (findErr) throw new Error(findErr.message);
    if (!office) throw new Error("Usuário não possui escritório próprio.");
    const officeId = (office as { id: string }).id;

    // Revogar assinatura (voltar para expirado, sem plano ativo)
    if (data.planCode === "none") {
      await externalAdmin
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("office_id", officeId)
        .eq("status", "active");
      const { error: offErr } = await externalAdmin
        .from("offices")
        .update({ status: "expired" })
        .eq("id", officeId);
      if (offErr) throw new Error(offErr.message);
      return { ok: true, planCode: null, currentPeriodEnd: null };
    }

    const { data: plans, error: planErr } = await externalAdmin
      .from("plans")
      .select("id, code");
    if (planErr) throw new Error(planErr.message);
    let match = ((plans ?? []) as Array<{ id: string; code: string }>).find((p) => {
      const c = (p.code ?? "").toLowerCase();
      if (data.planCode === "basico") return c.includes("basic") || c.includes("bás");
      if (data.planCode === "premium") return c.includes("premium");
      return c.includes("enterprise");
    }) ?? null;

    // Cria o plano automaticamente se ainda não existir na tabela
    if (!match) {
      const defaults: Record<string, { code: string; name: string; price_cents: number }> = {
        basico: { code: "basico", name: "Básico", price_cents: 9700 },
        premium: { code: "premium", name: "Premium", price_cents: 19700 },
        enterprise: { code: "enterprise", name: "Enterprise", price_cents: 0 },
      };
      const def = defaults[data.planCode];
      const { data: created, error: createErr } = await externalAdmin
        .from("plans")
        .insert({ code: def.code, name: def.name, price_cents: def.price_cents, active: true })
        .select("id, code")
        .single();
      if (createErr || !created) {
        throw new Error(`Não foi possível criar o plano "${data.planCode}": ${createErr?.message ?? "erro desconhecido"}`);
      }
      match = created as { id: string; code: string };
    }


    const currentPeriodEnd = new Date(Date.now() + data.months * 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: existing } = await externalAdmin
      .from("subscriptions")
      .select("id")
      .eq("office_id", officeId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error: updErr } = await externalAdmin
        .from("subscriptions")
        .update({
          plan_id: match.id,
          status: "active",
          current_period_end: currentPeriodEnd,
        })
        .eq("id", (existing as { id: string }).id);
      if (updErr) throw new Error(updErr.message);
    } else {
      const { error: insErr } = await externalAdmin.from("subscriptions").insert({
        office_id: officeId,
        plan_id: match.id,
        status: "active",
        current_period_end: currentPeriodEnd,
      } as never);
      if (insErr) throw new Error(insErr.message);
    }

    const { error: offErr } = await externalAdmin
      .from("offices")
      .update({ status: "active", trial_expires_at: null })
      .eq("id", officeId);
    if (offErr) throw new Error(offErr.message);

    return { ok: true, planCode: data.planCode, currentPeriodEnd };
  });
