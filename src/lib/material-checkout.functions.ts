import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const MATERIAL_PRICE = 29.9;
const BUCKET = "materiais";
const LINK_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

const CategorySchema = z.string().min(1).max(64).regex(/^[a-z0-9-]+$/);
const SlugSchema = z.string().min(1).max(120).regex(/^[a-z0-9-]+$/);

const BaseSchema = z.object({
  category: CategorySchema,
  slug: SlugSchema,
  email: z.string().email().max(255),
  name: z.string().min(2).max(120),
  cpf: z.string().min(11).max(14),
});

const PixSchema = BaseSchema;

const CardSchema = BaseSchema.extend({
  cardToken: z.string().min(10),
  paymentMethodId: z.string().min(1).max(40),
  issuerId: z.string().optional(),
  installments: z.number().int().min(1).max(6),
});

const StatusSchema = z.object({
  paymentId: z.string().min(1).max(40),
  email: z.string().email().max(255),
});

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") || parts[0] || "" };
}

function externalRef(category: string, slug: string, email: string) {
  return `material:${category}:${slug};email:${email}`;
}

async function getMaterialRow(category: string, slug: string) {
  const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { data } = await supabaseAdmin
    .from("material_files")
    .select("filename, storage_path, content_type")
    .eq("category", category)
    .eq("slug", slug)
    .maybeSingle();
  return data as { filename: string; storage_path: string; content_type: string | null } | null;
}

async function upsertPurchase(row: {
  paymentId: string;
  category: string;
  slug: string;
  email: string;
  name?: string;
  status: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
  await supabaseAdmin.from("material_purchases").upsert(
    {
      payment_id: row.paymentId,
      category: row.category,
      slug: row.slug,
      buyer_email: row.email,
      buyer_name: row.name ?? null,
      amount: MATERIAL_PRICE,
      status: row.status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "payment_id" },
  );
}

/** Gera link assinado de 7 dias para o material comprado. */
async function signedDownload(category: string, slug: string) {
  const row = await getMaterialRow(category, slug);
  if (!row) return { url: null as string | null, filename: null as string | null };
  const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { data: signed, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(row.storage_path, LINK_TTL_SECONDS, { download: row.filename });
  if (error) return { url: null, filename: row.filename };
  return { url: signed.signedUrl, filename: row.filename };
}

/**
 * Entrega o material: gera link assinado e envia e-mail personalizado.
 * Idempotente por payment_id (usa delivered_at).
 */
export async function fulfillMaterialPurchase(paymentId: string) {
  const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { data: purchase } = await supabaseAdmin
    .from("material_purchases")
    .select("payment_id, category, slug, buyer_email, buyer_name, delivered_at")
    .eq("payment_id", paymentId)
    .maybeSingle();
  if (!purchase) return { ok: false as const, reason: "not_found" };

  const p = purchase as {
    category: string;
    slug: string;
    buyer_email: string;
    buyer_name: string | null;
    delivered_at: string | null;
  };

  const { url, filename } = await signedDownload(p.category, p.slug);
  if (p.delivered_at) return { ok: true as const, url };
  if (!url) return { ok: false as const, reason: "file_missing" };

  try {
    const { seuNegonioTitle } = await import("./material-title.server");
    const materialTitle = seuNegonioTitle(p.slug) ?? filename ?? "Material ArqHub";
    const React = await import("react");
    const { render } = await import("@react-email/components");
    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    const tpl = TEMPLATES["material-purchase"];
    if (!tpl) return { ok: false as const, reason: "no_template" };

    const templateData = {
      name: p.buyer_name?.split(/\s+/)[0] ?? null,
      materialTitle,
      amountBRL: formatBRL(MATERIAL_PRICE),
      downloadUrl: url,
      expiresLabel: "7 dias",
      format: /\.(xlsx|xls|csv)$/i.test(filename ?? "") ? "Planilha" : "PDF",
    };
    const element = React.createElement(tpl.component as any, templateData);
    const html = await render(element);
    const plainText = await render(element, { plainText: true });
    const subject =
      typeof tpl.subject === "function" ? tpl.subject(templateData) : tpl.subject;

    const messageId = crypto.randomUUID();

    // Token de descadastro
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .upsert({ email: p.buyer_email, token }, { onConflict: "email", ignoreDuplicates: true });
    const { data: storedTok } = await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", p.buyer_email)
      .maybeSingle();

    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: "material-purchase",
      recipient_email: p.buyer_email,
      status: "pending",
    });

    const { enqueueEmail } = await import("@/lib/email-send.server");
    await enqueueEmail({
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: p.buyer_email,
        from: `ArqHub <noreply@notify.arqhub.world>`,
        sender_domain: "notify.arqhub.world",
        subject,
        html,
        text: plainText,
        purpose: "transactional",
        label: "material-purchase",
        idempotency_key: `material-purchase-${paymentId}`,
        unsubscribe_token: storedTok?.token ?? token,
        queued_at: new Date().toISOString(),
      },
    });

    await supabaseAdmin
      .from("material_purchases")
      .update({ delivered_at: new Date().toISOString(), status: "approved" })
      .eq("payment_id", paymentId);
  } catch (err) {
    console.error("[fulfillMaterialPurchase]", err);
    return { ok: false as const, reason: "email_failed", url };
  }

  return { ok: true as const, url };
}

export const createMaterialPixCheckout = createServerFn({ method: "POST" })
  .inputValidator((d) => PixSchema.parse(d))
  .handler(async ({ data }) => {
    const row = await getMaterialRow(data.category, data.slug);
    if (!row) throw new Error("Material indisponível no momento.");

    const { createPixPayment } = await import("@/lib/mercadopago.server");
    const name = splitName(data.name);
    const pay = await createPixPayment({
      amount: MATERIAL_PRICE,
      description: `ArqHub — Material avulso (${data.slug})`,
      payerEmail: data.email,
      payerCpf: data.cpf,
      payerFirstName: name.first,
      payerLastName: name.last,
      externalReference: externalRef(data.category, data.slug, data.email),
    });

    const paymentId = String(pay.id);
    await upsertPurchase({
      paymentId,
      category: data.category,
      slug: data.slug,
      email: data.email,
      name: data.name,
      status: pay.status ?? "pending",
    });

    const td = pay.point_of_interaction?.transaction_data;
    return {
      paymentId,
      status: pay.status,
      qrCode: td?.qr_code ?? "",
      qrCodeBase64: td?.qr_code_base64 ?? "",
      ticketUrl: td?.ticket_url ?? "",
      amount: MATERIAL_PRICE,
    };
  });

export const createMaterialCardCheckout = createServerFn({ method: "POST" })
  .inputValidator((d) => CardSchema.parse(d))
  .handler(async ({ data }) => {
    const row = await getMaterialRow(data.category, data.slug);
    if (!row) throw new Error("Material indisponível no momento.");

    const { createCardPayment } = await import("@/lib/mercadopago.server");
    const pay = await createCardPayment({
      amount: MATERIAL_PRICE,
      description: `ArqHub — Material avulso (${data.slug})`,
      token: data.cardToken,
      installments: data.installments,
      paymentMethodId: data.paymentMethodId,
      issuerId: data.issuerId,
      payerEmail: data.email,
      payerCpf: data.cpf,
      externalReference: externalRef(data.category, data.slug, data.email),
    });

    const paymentId = String(pay.id);
    await upsertPurchase({
      paymentId,
      category: data.category,
      slug: data.slug,
      email: data.email,
      name: data.name,
      status: pay.status ?? "pending",
    });

    let downloadUrl: string | null = null;
    if (pay.status === "approved") {
      const res = await fulfillMaterialPurchase(paymentId);
      downloadUrl = res.url ?? null;
    }

    return {
      paymentId,
      status: pay.status,
      statusDetail: pay.status_detail,
      downloadUrl,
    };
  });

export const getMaterialPurchaseStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => StatusSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: purchase } = await supabaseAdmin
      .from("material_purchases")
      .select("payment_id, status, delivered_at, buyer_email")
      .eq("payment_id", data.paymentId)
      .maybeSingle();
    if (!purchase) return { status: "unknown", downloadUrl: null as string | null };

    // Só o comprador (e-mail informado no checkout) pode consultar/baixar.
    const buyerEmail = ((purchase as { buyer_email?: string }).buyer_email ?? "").trim().toLowerCase();
    if (buyerEmail !== data.email.trim().toLowerCase()) {
      return { status: "unknown", downloadUrl: null as string | null };
    }

    const { getPayment } = await import("@/lib/mercadopago.server");
    const pay = await getPayment(data.paymentId);

    if (pay.status !== (purchase as any).status) {
      await supabaseAdmin
        .from("material_purchases")
        .update({ status: pay.status, updated_at: new Date().toISOString() })
        .eq("payment_id", data.paymentId);
    }

    if (pay.status === "approved") {
      const res = await fulfillMaterialPurchase(data.paymentId);
      return { status: pay.status, downloadUrl: res.url ?? null };
    }

    return { status: pay.status, downloadUrl: null as string | null };
  });
