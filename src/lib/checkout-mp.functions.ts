import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { recordPaymentEvent, recordPaymentTransition } from "@/lib/payment-tracking.functions";

const PixSchema = z.object({
  planCode: z.enum(["basico", "premium"]),
  frequency: z.enum(["monthly", "yearly"]),
  email: z.string().email(),
  cpf: z.string().min(11).max(14),
  name: z.string().min(2).max(120),
});

const CardSchema = z.object({
  planCode: z.enum(["basico", "premium"]),
  frequency: z.enum(["monthly", "yearly"]),
  email: z.string().email(),
  cpf: z.string().min(11).max(14),
  name: z.string().min(2).max(120),
  cardToken: z.string().min(10),
  paymentMethodId: z.string().min(1).max(40),
  issuerId: z.string().optional(),
  installments: z.number().int().min(1).max(12),
  backUrl: z.string().url(),
});

const StatusSchema = z.object({
  paymentId: z.string().min(1).max(40),
});

function planPrice(code: "basico" | "premium", freq: "monthly" | "yearly") {
  const monthly = code === "premium" ? 249.99 : 129.99;
  return freq === "yearly" ? Number((monthly * 12 * 0.8).toFixed(2)) : monthly;
}

function planName(code: "basico" | "premium") {
  return code === "premium" ? "Premium" : "Básico";
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") || parts[0] || "" };
}

export const getMpPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env.MERCADOPAGO_PUBLIC_KEY;
  if (!key) throw new Error("MERCADOPAGO_PUBLIC_KEY não configurada");
  return { publicKey: key };
});

export const createPixCheckout = createServerFn({ method: "POST" })
  .inputValidator((d) => PixSchema.parse(d))
  .handler(async ({ data }) => {
    const { createPixPayment } = await import("@/lib/mercadopago.server");
    const amount = planPrice(data.planCode, data.frequency);
    const name = splitName(data.name);
    const freqLabel = data.frequency === "yearly" ? "Anual" : "Mensal";
    const description = `ArqHub ${planName(data.planCode)} (${freqLabel})`;
    const externalReference = `plan:${data.planCode};freq:${data.frequency};type:pix;email:${data.email}`;

    const pay = await createPixPayment({
      amount,
      description,
      payerEmail: data.email,
      payerCpf: data.cpf,
      payerFirstName: name.first,
      payerLastName: name.last,
      externalReference,
    });

    const paymentId = String(pay.id);
    await recordPaymentEvent({
      paymentId,
      eventType: "created",
      status: pay.status,
      method: "pix",
      amount,
      planCode: data.planCode,
      frequency: data.frequency,
      payerEmail: data.email,
      payerCpf: data.cpf.replace(/\D/g, ""),
      externalReference,
    });

    const td = pay.point_of_interaction?.transaction_data;
    return {
      paymentId,
      status: pay.status,
      qrCode: td?.qr_code ?? "",
      qrCodeBase64: td?.qr_code_base64 ?? "",
      ticketUrl: td?.ticket_url ?? "",
      amount,
    };
  });

export const createCardCheckout = createServerFn({ method: "POST" })
  .inputValidator((d) => CardSchema.parse(d))
  .handler(async ({ data }) => {
    const {
      createCardPayment,
      createPreapprovalWithCardToken,
    } = await import("@/lib/mercadopago.server");

    const amount = planPrice(data.planCode, data.frequency);
    const freqLabel = data.frequency === "yearly" ? "Anual" : "Mensal";
    const description = `ArqHub ${planName(data.planCode)} (${freqLabel})`;

    // Anual = pagamento único. Mensal = assinatura recorrente.
    if (data.frequency === "yearly") {
      const externalReference = `plan:${data.planCode};freq:yearly;type:card_once;email:${data.email}`;
      const pay = await createCardPayment({
        amount,
        description,
        token: data.cardToken,
        installments: data.installments,
        paymentMethodId: data.paymentMethodId,
        issuerId: data.issuerId,
        payerEmail: data.email,
        payerCpf: data.cpf,
        externalReference,
      });
      const paymentId = String(pay.id);
      await recordPaymentEvent({
        paymentId,
        eventType: "created",
        status: pay.status,
        statusDetail: pay.status_detail,
        method: "card",
        amount,
        planCode: data.planCode,
        frequency: data.frequency,
        payerEmail: data.email,
        payerCpf: data.cpf.replace(/\D/g, ""),
        externalReference,
      });
      // Caso já venha aprovado, registra transição
      await recordPaymentTransition(paymentId, {
        status: pay.status,
        status_detail: pay.status_detail,
        external_reference: externalReference,
        transaction_amount: amount,
        payment_method_id: data.paymentMethodId,
        payer: { email: data.email },
      });
      return {
        kind: "payment" as const,
        paymentId,
        status: pay.status,
        statusDetail: pay.status_detail,
      };
    }

    const externalReference = `plan:${data.planCode};freq:monthly;type:card_recurring;email:${data.email}`;
    const pre = await createPreapprovalWithCardToken({
      reason: description,
      amount,
      payerEmail: data.email,
      cardTokenId: data.cardToken,
      externalReference,
      backUrl: data.backUrl,
    });
    await recordPaymentEvent({
      preapprovalId: pre.id,
      eventType: "created",
      status: pre.status,
      method: "card",
      amount,
      planCode: data.planCode,
      frequency: data.frequency,
      payerEmail: data.email,
      payerCpf: data.cpf.replace(/\D/g, ""),
      externalReference,
    });
    return {
      kind: "preapproval" as const,
      preapprovalId: pre.id,
      status: pre.status,
    };
  });

export const getPaymentStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => StatusSchema.parse(d))
  .handler(async ({ data }) => {
    const { getPayment } = await import("@/lib/mercadopago.server");
    const pay = await getPayment(data.paymentId);
    await recordPaymentTransition(String(pay.id), pay as any);
    return { status: pay.status, statusDetail: pay.status_detail };
  });
