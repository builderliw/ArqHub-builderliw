import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/external-supabase/auth-middleware";

const TrackingSchema = z.object({
  paymentId: z.string().min(1).max(64),
});

const ListAdminSchema = z.object({
  limit: z.number().int().min(1).max(200).default(50),
  before: z.string().optional(),
  status: z.string().optional(),
  method: z.string().optional(),
});

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseExternalReference(ref: string | null | undefined) {
  if (!ref) return {} as Record<string, string>;
  const out: Record<string, string> = {};
  for (const part of ref.split(";")) {
    const [k, v] = part.split(":");
    if (k && v !== undefined) out[k.trim()] = v.trim();
  }
  return out;
}

/**
 * Registra um evento de pagamento de forma idempotente.
 * Chamado pelo checkout, pelo polling e pelo webhook.
 */
export async function recordPaymentEvent(input: {
  paymentId?: string | null;
  preapprovalId?: string | null;
  eventType:
    | "created"
    | "pending"
    | "approved"
    | "failed"
    | "webhook_received"
    | "subscription_activated";
  status?: string | null;
  statusDetail?: string | null;
  method?: "pix" | "card" | null;
  amount?: number | null;
  planCode?: string | null;
  frequency?: string | null;
  payerEmail?: string | null;
  payerCpf?: string | null;
  externalReference?: string | null;
  officeId?: string | null;
  raw?: Record<string, unknown> | null;
}) {
  const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { error } = await supabaseAdmin.from("payment_events").upsert(
    {
      payment_id: input.paymentId ?? null,
      preapproval_id: input.preapprovalId ?? null,
      event_type: input.eventType,
      status: input.status ?? null,
      status_detail: input.statusDetail ?? null,
      method: input.method ?? null,
      amount: input.amount ?? null,
      plan_code: input.planCode ?? null,
      frequency: input.frequency ?? null,
      payer_email: input.payerEmail ?? null,
      payer_cpf: input.payerCpf ?? null,
      external_reference: input.externalReference ?? null,
      office_id: input.officeId ?? null,
      raw: (input.raw ?? null) as any,
    },
    { onConflict: "payment_id,event_type", ignoreDuplicates: true },
  );
  if (error) console.error("[recordPaymentEvent]", error);
}

/**
 * Marca uma transição (approved/failed) e ativa a assinatura quando aprovada.
 * Idempotente — pode ser chamado várias vezes pelo polling e pelo webhook.
 */
export async function recordPaymentTransition(paymentId: string, mp: {
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  payment_method_id?: string;
  payer?: { email?: string };
  date_approved?: string | null;
}) {
  const ref = parseExternalReference(mp.external_reference);
  const method: "pix" | "card" = mp.payment_method_id === "pix" ? "pix" : "card";

  let eventType: "approved" | "failed" | "pending" | null = null;
  if (mp.status === "approved") eventType = "approved";
  else if (["rejected", "cancelled", "refunded", "charged_back"].includes(mp.status)) eventType = "failed";

  if (eventType) {
    await recordPaymentEvent({
      paymentId,
      eventType,
      status: mp.status,
      statusDetail: mp.status_detail ?? null,
      method,
      amount: mp.transaction_amount ?? null,
      planCode: ref.plan ?? null,
      frequency: ref.freq ?? null,
      payerEmail: mp.payer?.email ?? ref.email ?? null,
      externalReference: mp.external_reference ?? null,
      raw: { date_approved: mp.date_approved ?? null },
    });
  }

  if (mp.status === "approved") {
    const payerEmail = mp.payer?.email ?? ref.email ?? null;
    await activateSubscriptionIfNeeded(paymentId, ref, payerEmail);
    await sendPaymentApprovedEmailIfNeeded(paymentId, ref, payerEmail, mp.transaction_amount ?? null);
  }
}

async function activateSubscriptionIfNeeded(
  paymentId: string,
  ref: Record<string, string>,
  payerEmail: string | null,
) {
  const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
  // Idempotência via unique index em (payment_id, event_type)
  const { data: existing } = await supabaseAdmin
    .from("payment_events")
    .select("id")
    .eq("payment_id", paymentId)
    .eq("event_type", "subscription_activated")
    .maybeSingle();
  if (existing) return;

  // Tenta ativar assinatura na base externa, se houver office_id.
  try {
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const officeId = ref.office;
    if (officeId) {
      await externalAdmin
        .from("subscriptions")
        .update({
          status: "active",
          mp_last_payment_id: paymentId,
          last_payment_at: new Date().toISOString(),
          last_payment_status: "approved",
        })
        .eq("office_id", officeId);
      await externalAdmin.from("offices").update({ status: "active" }).eq("id", officeId);
    }
  } catch (err) {
    console.error("[activateSubscription]", err);
  }

  await recordPaymentEvent({
    paymentId,
    eventType: "subscription_activated",
    status: "active",
    planCode: ref.plan ?? null,
    frequency: ref.freq ?? null,
    payerEmail,
    externalReference: Object.entries(ref).map(([k, v]) => `${k}:${v}`).join(";"),
  });
}

/**
 * Verifica se já existe conta com o e-mail informado (por profiles).
 */
async function emailHasExistingAccount(email: string): Promise<boolean> {
  try {
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data } = await externalAdmin
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .limit(1)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

function planLabelFromCode(code: string | null | undefined) {
  if (code === "premium") return "Premium";
  if (code === "basico") return "Básico";
  return null;
}

function formatBRLValue(v: number | null | undefined) {
  if (v === null || v === undefined) return null;
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function computeExpiresAt(frequency: string | null | undefined) {
  const now = new Date();
  if (frequency === "yearly") now.setFullYear(now.getFullYear() + 1);
  else now.setMonth(now.getMonth() + 1);
  return now;
}

/**
 * Envia (uma única vez) o e-mail de boas-vindas / pagamento aprovado.
 * Idempotente via evento `welcome_email_sent`.
 */
async function sendPaymentApprovedEmailIfNeeded(
  paymentId: string,
  ref: Record<string, string>,
  payerEmail: string | null,
  amount: number | null,
) {
  if (!payerEmail) return;
  const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");

  const { data: alreadySent } = await supabaseAdmin
    .from("payment_events")
    .select("id")
    .eq("payment_id", paymentId)
    .eq("event_type", "welcome_email_sent")
    .maybeSingle();
  if (alreadySent) return;

  const email = payerEmail.toLowerCase();
  const emailExists = await emailHasExistingAccount(email);

  try {
    // Tudo no Supabase yknwdpyaevodvonvhadt (antes: banco Lovable Cloud)
    const lov = supabaseAdmin;

    // Suppression
    const { data: supp } = await lov
      .from("suppressed_emails")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    if (supp) {
      await recordPaymentEvent({
        paymentId,
        eventType: "welcome_email_sent" as any,
        status: "suppressed",
        payerEmail: email,
      });
      return;
    }

    // Unsubscribe token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0")).join("");
    await lov.from("email_unsubscribe_tokens").upsert(
      { email, token },
      { onConflict: "email", ignoreDuplicates: true },
    );
    const { data: storedTok } = await lov
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", email)
      .maybeSingle();
    const unsubscribeToken = storedTok?.token ?? token;

    // Render template
    const React = await import("react");
    const { render } = await import("@react-email/components");
    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    const tpl = TEMPLATES["payment-approved"];
    if (!tpl) return;

    const frequency = ref.freq ?? null;
    const expires = computeExpiresAt(frequency);
    const templateData = {
      name: null,
      planLabel: planLabelFromCode(ref.plan ?? null),
      frequencyLabel: frequency === "yearly" ? "Anual" : frequency === "monthly" ? "Mensal" : null,
      amountBRL: formatBRLValue(amount),
      expiresAt: expires.toLocaleDateString("pt-BR"),
      loginUrl: "https://arqhub.world/entrar/escritorio",
      recoverUrl: "https://arqhub.world/esqueci-senha",
      emailExists,
    };
    const element = React.createElement(tpl.component as any, templateData);
    const html = await render(element);
    const plainText = await render(element, { plainText: true });
    const subject = typeof tpl.subject === "function" ? tpl.subject(templateData) : tpl.subject;

    const messageId = crypto.randomUUID();
    const idempotencyKey = `payment-approved-${paymentId}`;

    await lov.from("email_send_log").insert({
      message_id: messageId,
      template_name: "payment-approved",
      recipient_email: email,
      status: "pending",
    });

    const { enqueueEmail } = await import("@/lib/email-send.server");
    await enqueueEmail({
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: email,
        from: `arqhub-pro-suite <noreply@notify.arqhub.world>`,
        sender_domain: "notify.arqhub.world",
        subject,
        html,
        text: plainText,
        purpose: "transactional",
        label: "payment-approved",
        idempotency_key: idempotencyKey,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[sendPaymentApprovedEmail]", err);
  }

  await recordPaymentEvent({
    paymentId,
    eventType: "welcome_email_sent" as any,
    status: emailExists ? "existing_account" : "new_account",
    payerEmail: email,
  });
}


/**
 * Endpoint público de status — usado pela página de acompanhamento.
 * Consulta MP em tempo real + registra transição idempotente.
 */
export const getPaymentTracking = createServerFn({ method: "POST" })
  .inputValidator((d) => TrackingSchema.parse(d))
  .handler(async ({ data }) => {
    const { getPayment } = await import("@/lib/mercadopago.server");
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");

    let mp: any = null;
    try {
      mp = await getPayment(data.paymentId);
    } catch (err) {
      console.error("[getPaymentTracking] MP error", err);
    }

    if (mp?.id) {
      await recordPaymentTransition(String(mp.id), mp);
    }

    const { data: events } = await supabaseAdmin
      .from("payment_events")
      .select("*")
      .eq("payment_id", data.paymentId)
      .order("created_at", { ascending: true });

    const approved = events?.find((e) => e.event_type === "approved");
    const activated = events?.find((e) => e.event_type === "subscription_activated");
    const created = events?.find((e) => e.event_type === "created");
    const welcome = events?.find((e) => e.event_type === "welcome_email_sent");

    const payerEmail = created?.payer_email ?? mp?.payer?.email ?? null;
    let emailExists: boolean | null = null;
    if (welcome?.status === "existing_account") emailExists = true;
    else if (welcome?.status === "new_account") emailExists = false;
    else if (payerEmail && (approved || mp?.status === "approved")) {
      // fallback lookup on demand
      try {
        emailExists = await emailHasExistingAccount(payerEmail);
      } catch {
        emailExists = null;
      }
    }

    return {
      status: mp?.status ?? approved?.status ?? "pending",
      statusDetail: mp?.status_detail ?? approved?.status_detail ?? null,
      method: (created?.method ?? (mp?.payment_method_id === "pix" ? "pix" : "card")) as "pix" | "card",
      amount: Number(mp?.transaction_amount ?? created?.amount ?? 0),
      planCode: created?.plan_code ?? null,
      frequency: created?.frequency ?? null,
      payerEmail: payerEmail
        ? `${payerEmail[0]}***@${payerEmail.split("@")[1] ?? ""}`
        : null,
      emailExists,
      createdAt: created?.created_at ?? null,
      approvedAt: approved?.created_at ?? mp?.date_approved ?? null,
      subscriptionActivated: Boolean(activated),
      events: (events ?? []).map((e) => ({
        id: e.id,
        type: e.event_type,
        status: e.status,
        createdAt: e.created_at,
      })),
    };
  });


/**
 * Lista pagamentos aprovados do usuário autenticado (para comprovantes).
 */
export const listMyPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as any)?.email as string | undefined;
    if (!email) return { items: [] };
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data } = await supabaseAdmin
      .from("payment_events")
      .select("*")
      .eq("payer_email", email)
      .in("event_type", ["approved", "subscription_activated"])
      .order("created_at", { ascending: false })
      .limit(50);
    return { items: data ?? [] };
  });

/**
 * Detalhe do comprovante (auth — só dono ou admin).
 */
export const getMyReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => TrackingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const email = ((context.claims as any)?.email as string | undefined)?.toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: rows } = await supabaseAdmin
      .from("payment_events")
      .select("*")
      .eq("payment_id", data.paymentId)
      .order("created_at", { ascending: true });

    const created = rows?.find((r) => r.event_type === "created");
    const approved = rows?.find((r) => r.event_type === "approved");
    if (!approved) throw new Error("Pagamento ainda não aprovado");

    const isOwner = (approved.payer_email ?? created?.payer_email ?? "").toLowerCase() === email;
    const isAdmin = email ? adminEmails().includes(email) : false;
    if (!isOwner && !isAdmin) throw new Error("Acesso negado");

    return {
      paymentId: data.paymentId,
      amount: Number(approved.amount ?? created?.amount ?? 0),
      planCode: created?.plan_code ?? approved.plan_code ?? null,
      frequency: created?.frequency ?? approved.frequency ?? null,
      method: created?.method ?? approved.method ?? null,
      payerEmail: approved.payer_email ?? created?.payer_email ?? null,
      approvedAt: approved.created_at,
    };
  });

/**
 * Log admin — todas as transações.
 */
const ListAdminWithTokenSchema = ListAdminSchema.extend({ accessToken: z.string().min(10) });

export const listAdminPayments = createServerFn({ method: "POST" })
  .inputValidator((d) => ListAdminWithTokenSchema.parse(d ?? {}))
  .handler(async ({ data }) => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    let q = supabaseAdmin
      .from("payment_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.before) q = q.lt("created_at", data.before);
    if (data.status) q = q.eq("status", data.status);
    if (data.method) q = q.eq("method", data.method);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });
