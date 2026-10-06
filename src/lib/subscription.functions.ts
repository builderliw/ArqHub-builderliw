import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TokenSchema = z.object({ accessToken: z.string().min(10) });

export const getMySubscription = createServerFn({ method: "POST" })
  .inputValidator((d) => TokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: u, error: ue } = await externalAdmin.auth.getUser(data.accessToken);
    if (ue || !u.user) throw new Error("Não autenticado");

    const { data: office } = await externalAdmin
      .from("offices")
      .select("id, name")
      .eq("owner_id", u.user.id)
      .maybeSingle();
    if (!office) return { subscription: null as any, plan: null as any };

    const { data: sub } = await externalAdmin
      .from("subscriptions")
      .select("id, status, plan_id, mp_preapproval_id, last_payment_at, last_payment_status, updated_at")
      .eq("office_id", office.id)
      .maybeSingle();
    if (!sub) return { subscription: null as any, plan: null as any };

    let plan: any = null;
    if (sub.plan_id) {
      const { data: p } = await externalAdmin
        .from("plans")
        .select("code, name, price_cents")
        .eq("id", sub.plan_id)
        .maybeSingle();
      plan = p ?? null;
    }
    return { subscription: sub, plan };
  });

export const cancelMySubscription = createServerFn({ method: "POST" })
  .inputValidator((d) => TokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: u, error: ue } = await externalAdmin.auth.getUser(data.accessToken);
    if (ue || !u.user) throw new Error("Não autenticado");

    const { data: office } = await externalAdmin
      .from("offices")
      .select("id")
      .eq("owner_id", u.user.id)
      .maybeSingle();
    if (!office) throw new Error("Escritório não encontrado");

    const { data: sub } = await externalAdmin
      .from("subscriptions")
      .select("id, mp_preapproval_id, status")
      .eq("office_id", office.id)
      .maybeSingle();
    if (!sub) throw new Error("Nenhuma assinatura encontrada");
    if (sub.status === "canceled") return { ok: true, already: true };

    // Best-effort cancel on Mercado Pago
    if (sub.mp_preapproval_id) {
      const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (token) {
        try {
          await fetch(`https://api.mercadopago.com/preapproval/${sub.mp_preapproval_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: "cancelled" }),
          });
        } catch {
          /* segue: marcamos local como canceled mesmo se MP falhar */
        }
      }
    }

    await externalAdmin
      .from("subscriptions")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("id", sub.id);

    return { ok: true, already: false };
  });
