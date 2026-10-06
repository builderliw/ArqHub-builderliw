import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const StartCheckoutSchema = z.object({
  accessToken: z.string().min(10),
  planCode: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/i),
  frequency: z.enum(["monthly", "yearly"]),
  backUrl: z.string().url(),
});

export const startCheckout = createServerFn({ method: "POST" })
  .inputValidator((d) => StartCheckoutSchema.parse(d))
  .handler(async ({ data }) => {
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { createPreapproval } = await import("@/lib/mercadopago.server");

    // Validate user via external supabase
    const { data: u, error: ue } = await externalAdmin.auth.getUser(data.accessToken);
    if (ue || !u.user) throw new Error("Não autenticado");
    const user = u.user;

    // Find office owned by user
    const { data: office } = await externalAdmin
      .from("offices")
      .select("id, name, owner_id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!office) throw new Error("Escritório não encontrado");

    // Find plan
    const { data: plan } = await externalAdmin
      .from("plans")
      .select("id, code, name, price_cents")
      .eq("code", data.planCode)
      .eq("active", true)
      .maybeSingle();
    if (!plan) throw new Error("Plano não encontrado");

    const monthly = (plan.price_cents ?? 0) / 100;
    const amount = data.frequency === "yearly" ? monthly * 12 * 0.8 : monthly;
    if (amount <= 0) throw new Error("Plano sem preço configurado");

    const pre = await createPreapproval({
      payerEmail: user.email ?? "",
      reason: `ArqHub ${plan.name} (${data.frequency === "yearly" ? "Anual" : "Mensal"})`,
      amount,
      frequency: data.frequency,
      externalReference: `office:${office.id};plan:${plan.id};freq:${data.frequency}`,
      backUrl: data.backUrl,
    });

    // Upsert pending subscription
    await externalAdmin.from("subscriptions").upsert(
      {
        office_id: office.id,
        plan_id: plan.id,
        status: "pending",
        mp_preapproval_id: pre.id,
      },
      { onConflict: "office_id" },
    );

    return { initPoint: pre.init_point, preapprovalId: pre.id };
  });
