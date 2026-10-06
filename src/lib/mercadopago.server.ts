// Mercado Pago REST helpers — server-only.
const BASE = "https://api.mercadopago.com";

function token() {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!t) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
  return t;
}

async function mp<T = any>(
  path: string,
  init: { method?: string; body?: unknown; idemKey?: string } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      ...(init.idemKey ? { "X-Idempotency-Key": init.idemKey } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`MP ${res.status}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : ({} as T);
}

export type Frequency = "monthly" | "yearly";

function randomIdem() {
  return `arqhub-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------- Recorrência clássica (usada pelo fluxo interno do escritório) ----------
export async function createPreapproval(opts: {
  payerEmail: string;
  reason: string;
  amount: number;
  frequency: Frequency;
  externalReference: string;
  backUrl: string;
}) {
  const body = {
    reason: opts.reason.slice(0, 256),
    external_reference: opts.externalReference,
    payer_email: opts.payerEmail,
    back_url: opts.backUrl,
    auto_recurring: {
      frequency: opts.frequency === "yearly" ? 12 : 1,
      frequency_type: "months",
      transaction_amount: Number(opts.amount.toFixed(2)),
      currency_id: "BRL",
    },
    status: "pending",
  };
  return mp<{ id: string; init_point: string; status: string }>("/preapproval", { body });
}

// ---------- PIX (Checkout Transparente) ----------
export async function createPixPayment(opts: {
  amount: number; // BRL
  description: string;
  payerEmail: string;
  payerCpf: string;
  payerFirstName?: string;
  payerLastName?: string;
  externalReference: string;
}) {
  const body = {
    transaction_amount: Number(opts.amount.toFixed(2)),
    description: opts.description.slice(0, 256),
    payment_method_id: "pix",
    external_reference: opts.externalReference,
    payer: {
      email: opts.payerEmail,
      first_name: opts.payerFirstName,
      last_name: opts.payerLastName,
      identification: { type: "CPF", number: opts.payerCpf.replace(/\D/g, "") },
    },
  };
  return mp<{
    id: number;
    status: string;
    point_of_interaction?: {
      transaction_data?: {
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
      };
    };
  }>("/v1/payments", { body, idemKey: randomIdem() });
}

// ---------- Cartão de crédito (one-time, anual) ----------
export async function createCardPayment(opts: {
  amount: number;
  description: string;
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string;
  payerEmail: string;
  payerCpf: string;
  externalReference: string;
}) {
  const body: any = {
    transaction_amount: Number(opts.amount.toFixed(2)),
    description: opts.description.slice(0, 256),
    token: opts.token,
    installments: opts.installments,
    payment_method_id: opts.paymentMethodId,
    issuer_id: opts.issuerId,
    external_reference: opts.externalReference,
    capture: true,
    payer: {
      email: opts.payerEmail,
      identification: { type: "CPF", number: opts.payerCpf.replace(/\D/g, "") },
    },
  };
  return mp<{ id: number; status: string; status_detail: string }>(
    "/v1/payments",
    { body, idemKey: randomIdem() },
  );
}

// ---------- Assinatura recorrente no cartão (mensal) ----------
export async function createPreapprovalWithCardToken(opts: {
  reason: string;
  amount: number;
  payerEmail: string;
  cardTokenId: string;
  externalReference: string;
  backUrl: string;
}) {
  const body = {
    reason: opts.reason.slice(0, 256),
    external_reference: opts.externalReference,
    payer_email: opts.payerEmail,
    card_token_id: opts.cardTokenId,
    back_url: opts.backUrl,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: Number(opts.amount.toFixed(2)),
      currency_id: "BRL",
    },
    status: "authorized",
  };
  return mp<{ id: string; status: string; init_point: string }>("/preapproval", {
    body,
  });
}

export async function getPreapproval(id: string) {
  return mp(`/preapproval/${id}`, { method: "GET" });
}

export async function getPayment(id: string | number) {
  return mp<{
    id: number;
    status: string;
    status_detail: string;
    external_reference: string;
    payment_method_id: string;
  }>(`/v1/payments/${id}`, { method: "GET" });
}

// Verify webhook signature according to MP spec (x-signature: ts=..,v1=..)
export async function verifyMpSignature(req: {
  signature: string | null;
  requestId: string | null;
  dataId: string;
}): Promise<boolean> {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[mp-webhook] MERCADOPAGO_WEBHOOK_SECRET não configurado — rejeitando webhook");
    return false;
  }
  if (!req.signature) return false;
  const parts = Object.fromEntries(
    req.signature.split(",").map((s) => s.trim().split("=").map((x) => x.trim()) as [string, string]),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  const manifest = `id:${req.dataId};request-id:${req.requestId ?? ""};ts:${ts};`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(manifest));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === v1;
}
