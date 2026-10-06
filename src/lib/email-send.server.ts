// Envio de e-mails transacionais SEM a fila da Lovable.
// Substitui o antigo `rpc("enqueue_email")` + /lovable/email/queue/process.
//
// Provedor: Resend (https://resend.com) via HTTP — sem dependência extra.
// Variáveis de ambiente (servidor):
//   RESEND_API_KEY   -> obrigatório para enviar
//   EMAIL_FROM       -> opcional, sobrescreve o remetente (ex.: "ArqHub <noreply@arqhub.world>")
//   SITE_URL         -> opcional, padrão https://arqhub.world (link de descadastro)
//   EMAIL_REPLY_TO   -> opcional, e-mail que recebe as respostas (ex.: contato@arqhub.world)
//
// Se RESEND_API_KEY não estiver configurada, o e-mail NÃO é enviado,
// o erro é registrado em email_send_log e o fluxo do app continua.

type EmailPayload = {
  message_id: string;
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
  label?: string;
  idempotency_key?: string;
  unsubscribe_token?: string;
  /** Gravado em email_send_log.metadata (ex.: assunto, campanha, quem enviou). */
  log_metadata?: Record<string, unknown>;
  [k: string]: unknown;
};

async function logResult(p: EmailPayload, status: "sent" | "failed", error?: string) {
  try {
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    await externalAdmin.from("email_send_log").insert({
      message_id: p.message_id,
      template_name: p.label ?? "transactional",
      recipient_email: p.to,
      status,
      error_message: error ?? null,
      metadata: p.log_metadata ?? null,
    });
  } catch (e) {
    console.warn("[email] could not write email_send_log", e);
  }
}

/**
 * Mesma "assinatura" do antigo supabase.rpc("enqueue_email", {...})
 * para trocar as chamadas sem reescrever os fluxos.
 */
export async function enqueueEmail(args: {
  queue_name?: string;
  payload: EmailPayload;
}): Promise<{ error: Error | null }> {
  const p = args.payload;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const msg = "RESEND_API_KEY não configurada";
    console.error("[email]", msg);
    await logResult(p, "failed", msg);
    return { error: new Error(msg) };
  }

  const from = process.env.EMAIL_FROM || p.from || "ArqHub <noreply@arqhub.world>";
  const site = (process.env.SITE_URL || "https://arqhub.world").replace(/\/$/, "");
  const headers: Record<string, string> = {};
  if (p.unsubscribe_token) {
    const url = `${site}/email/unsubscribe?token=${encodeURIComponent(p.unsubscribe_token)}`;
    headers["List-Unsubscribe"] = `<${url}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(p.idempotency_key ? { "Idempotency-Key": p.idempotency_key.slice(0, 256) } : {}),
      },
      body: JSON.stringify({
        from,
        to: [p.to],
        subject: p.subject,
        html: p.html,
        text: p.text,
        headers,
        ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      const msg = `Resend ${res.status}: ${body.slice(0, 500)}`;
      await logResult(p, "failed", msg);
      return { error: new Error(msg) };
    }
    await logResult(p, "sent");
    return { error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logResult(p, "failed", msg);
    return { error: new Error(msg) };
  }
}
