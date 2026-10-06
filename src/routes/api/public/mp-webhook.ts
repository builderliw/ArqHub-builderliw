import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/mp-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
        const { verifyMpSignature, getPreapproval, getPayment } = await import(
          "@/lib/mercadopago.server"
        );
        const { recordPaymentEvent, recordPaymentTransition } = await import(
          "@/lib/payment-tracking.functions"
        );

        const url = new URL(request.url);
        const bodyText = await request.text();
        let payload: any = {};
        try {
          payload = bodyText ? JSON.parse(bodyText) : {};
        } catch {
          /* ignore */
        }

        const topic =
          payload.type ??
          payload.topic ??
          url.searchParams.get("type") ??
          url.searchParams.get("topic");
        const dataId =
          payload?.data?.id ??
          url.searchParams.get("data.id") ??
          url.searchParams.get("id") ??
          "";

        if (!dataId || !topic) return new Response("ignored", { status: 200 });

        const ok = await verifyMpSignature({
          signature: request.headers.get("x-signature"),
          requestId: request.headers.get("x-request-id"),
          dataId: String(dataId),
        });
        if (!ok) return new Response("invalid signature", { status: 401 });

        try {
          if (topic === "preapproval" || topic === "subscription_preapproval") {
            const pre: any = await getPreapproval(String(dataId));
            const ext: string = pre.external_reference ?? "";
            const officeId = /office:([0-9a-f-]+)/i.exec(ext)?.[1];

            await recordPaymentEvent({
              preapprovalId: pre.id,
              eventType: "webhook_received",
              status: pre.status,
              method: "card",
              externalReference: ext,
              raw: { topic, preapproval_status: pre.status },
            });

            if (!officeId) return new Response("ok", { status: 200 });

            const status = mapPreapprovalStatus(pre.status);
            const nextDue = pre.next_payment_date ?? null;

            await externalAdmin
              .from("subscriptions")
              .update({
                status,
                mp_preapproval_id: pre.id,
                mp_payer_id: pre.payer_id ? String(pre.payer_id) : null,
                current_period_end: nextDue,
              })
              .eq("office_id", officeId);

            await externalAdmin
              .from("offices")
              .update({ status: status === "active" ? "active" : "pending" })
              .eq("id", officeId);
          } else if (topic === "payment") {
            const pay: any = await getPayment(String(dataId));
            await recordPaymentEvent({
              paymentId: String(pay.id),
              eventType: "webhook_received",
              status: pay.status,
              statusDetail: pay.status_detail,
              method: pay.payment_method_id === "pix" ? "pix" : "card",
              amount: pay.transaction_amount,
              externalReference: pay.external_reference,
              payerEmail: pay.payer?.email,
              raw: { topic, status: pay.status },
            });
            await recordPaymentTransition(String(pay.id), pay);

            // Compra avulsa de material: entrega o arquivo por e-mail.
            if (
              typeof pay.external_reference === "string" &&
              pay.external_reference.startsWith("material:")
            ) {
              if (pay.status === "approved") {
                const { fulfillMaterialPurchase } = await import(
                  "@/lib/material-checkout.functions"
                );
                await fulfillMaterialPurchase(String(pay.id));
              }
              return new Response("ok", { status: 200 });
            }


            const preId = pay.metadata?.preapproval_id ?? pay.preapproval_id ?? null;
            if (preId) {
              await externalAdmin
                .from("subscriptions")
                .update({
                  mp_last_payment_id: String(pay.id),
                  last_payment_at: pay.date_approved ?? new Date().toISOString(),
                  last_payment_status: pay.status ?? null,
                })
                .eq("mp_preapproval_id", String(preId));
            }
          }
        } catch (err) {
          console.error("[mp-webhook]", err);
          return new Response("error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
      GET: async () => new Response("ok", { status: 200 }),
    },
  },
});

function mapPreapprovalStatus(s: string): string {
  switch (s) {
    case "authorized":
      return "active";
    case "paused":
      return "past_due";
    case "cancelled":
      return "cancelled";
    case "pending":
    default:
      return "pending";
  }
}
