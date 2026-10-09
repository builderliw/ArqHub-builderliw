import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ===================================================================
// Admin → E-mails personalizados
// - lista destinatários (todas as contas de login)
// - pré-visualiza o e-mail
// - envia para vários usuários, opcionalmente liberando N dias de teste
// - histórico de envios (email_send_log, template "admin-custom")
// ===================================================================

export type EmailRecipient = {
  id: string;
  email: string | null;
  fullName: string | null;
  officeId: string | null;
  officeName: string | null;
  officeStatus: string | null;
  trialExpiresAt: string | null;
  hasActivePlan: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
};

const ComposeSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  eyebrow: z.string().trim().max(60).optional().default(""),
  heading: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().min(5).max(10000),
  ctaLabel: z.string().trim().max(60).optional().default(""),
  ctaUrl: z.string().trim().url().max(500).optional().or(z.literal("")).default(""),
  signature: z.string().trim().max(500).optional().default(""),
  trialDays: z.number().int().min(0).max(90).default(0),
});
type Compose = z.infer<typeof ComposeSchema>;

type Vars = { nome: string; email: string; escritorio: string; dias: string; validade: string };

function fill(text: string, v: Vars): string {
  return text
    .replace(/\{\{\s*nome\s*\}\}/gi, v.nome)
    .replace(/\{\{\s*email\s*\}\}/gi, v.email)
    .replace(/\{\{\s*escritorio\s*\}\}/gi, v.escritorio)
    .replace(/\{\{\s*dias\s*\}\}/gi, v.dias)
    .replace(/\{\{\s*validade\s*\}\}/gi, v.validade);
}

async function renderEmail(c: Compose, v: Vars) {
  const React = (await import("react")).default;
  const { render } = await import("@react-email/components");
  const { TEMPLATES } = await import("@/lib/email-templates/registry");
  const tpl = TEMPLATES["admin-custom"];
  const props = {
    subject: fill(c.subject, v),
    eyebrow: fill(c.eyebrow, v),
    heading: fill(c.heading, v),
    message: fill(c.message, v),
    ctaLabel: fill(c.ctaLabel, v),
    ctaUrl: c.ctaUrl,
    signature: fill(c.signature, v),
  };
  const element = React.createElement(tpl.component, props);
  return {
    subject: props.subject,
    html: await render(element),
    text: await render(element, { plainText: true }),
  };
}

function firstName(full: string | null | undefined, email: string | null | undefined) {
  const n = (full ?? "").trim().split(/\s+/)[0];
  if (n) return n.charAt(0).toUpperCase() + n.slice(1);
  return (email ?? "").split("@")[0] || "";
}

function dateBR(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "";
}

// ------------------------------------------------------------------ listar
export const listEmailRecipients = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ accessToken: z.string().min(10) }).parse(d))
  .handler(async ({ data }): Promise<{ items: EmailRecipient[] }> => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");

    const users: Array<{ id: string; email: string | null; created_at: string | null; last_sign_in_at: string | null }> = [];
    for (let page = 1; page <= 20; page++) {
      const { data: res, error } = await externalAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      const batch = res?.users ?? [];
      for (const u of batch) {
        users.push({
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at ?? null,
          last_sign_in_at: u.last_sign_in_at ?? null,
        });
      }
      if (batch.length < 200) break;
    }

    const [{ data: profiles }, { data: offices }, { data: subs }] = await Promise.all([
      externalAdmin.from("profiles").select("id, full_name"),
      externalAdmin.from("offices").select("id, name, owner_id, status, trial_expires_at"),
      externalAdmin.from("subscriptions").select("office_id, status").eq("status", "active"),
    ]);
    const nameById = new Map(((profiles ?? []) as Array<{ id: string; full_name: string | null }>).map((p) => [p.id, p.full_name]));
    const officeByOwner = new Map(
      ((offices ?? []) as Array<{ id: string; name: string | null; owner_id: string; status: string | null; trial_expires_at: string | null }>)
        .map((o) => [o.owner_id, o]),
    );
    const activeOffices = new Set(((subs ?? []) as Array<{ office_id: string }>).map((s) => s.office_id));

    const items: EmailRecipient[] = users.map((u) => {
      const o = officeByOwner.get(u.id);
      return {
        id: u.id,
        email: u.email,
        fullName: nameById.get(u.id) ?? null,
        officeId: o?.id ?? null,
        officeName: o?.name ?? null,
        officeStatus: o?.status ?? null,
        trialExpiresAt: o?.trial_expires_at ?? null,
        hasActivePlan: o ? activeOffices.has(o.id) : false,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
      };
    });
    items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    return { items };
  });

// ------------------------------------------------------------- pré-visualizar
export const previewCustomEmail = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ accessToken: z.string().min(10), compose: ComposeSchema, sampleName: z.string().max(80).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);
    const c = data.compose;
    const validade = c.trialDays > 0 ? dateBR(new Date(Date.now() + c.trialDays * 86400000).toISOString()) : "";
    const r = await renderEmail(c, {
      nome: data.sampleName || "Ana",
      email: "ana@exemplo.com",
      escritorio: "Estúdio Exemplo",
      dias: String(c.trialDays || ""),
      validade,
    });
    return { subject: r.subject, html: r.html };
  });

// ------------------------------------------------------------------- enviar
const SendSchema = z.object({
  accessToken: z.string().min(10),
  userIds: z.array(z.string().uuid()).max(100).default([]),
  testToSelf: z.boolean().default(false),
  compose: ComposeSchema,
});

export type SendResult = {
  userId: string | null;
  email: string | null;
  name: string | null;
  emailStatus: "sent" | "failed" | "suppressed" | "no_email";
  emailError?: string;
  trial: "extended" | "skipped_active_plan" | "skipped_no_office" | "not_requested" | "failed";
  trialExpiresAt?: string | null;
};

async function getUnsubscribeToken(email: string) {
  const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { data: existing } = await externalAdmin
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", email)
    .limit(1)
    .maybeSingle();
  if (existing?.token) return existing.token as string;
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  await externalAdmin.from("email_unsubscribe_tokens").insert({ email, token });
  return token;
}

export const sendCustomEmail = createServerFn({ method: "POST" })
  .inputValidator((d) => SendSchema.parse(d))
  .handler(async ({ data }): Promise<{ campaignId: string; results: SendResult[] }> => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    const admin = await assertAdminByToken(data.accessToken);
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { enqueueEmail } = await import("@/lib/email-send.server");
    const c = data.compose;
    const campaignId = crypto.randomUUID();
    const results: SendResult[] = [];

    // Envio de teste: só para o próprio admin, sem mexer em teste grátis.
    if (data.testToSelf) {
      if (!admin.email) throw new Error("Seu usuário admin não tem e-mail.");
      const validade = c.trialDays > 0 ? dateBR(new Date(Date.now() + c.trialDays * 86400000).toISOString()) : "";
      const r = await renderEmail(c, {
        nome: firstName(null, admin.email),
        email: admin.email,
        escritorio: "Seu escritório",
        dias: String(c.trialDays || ""),
        validade,
      });
      const { error } = await enqueueEmail({
        payload: {
          message_id: crypto.randomUUID(),
          to: admin.email,
          subject: `[TESTE] ${r.subject}`,
          html: r.html,
          text: r.text,
          label: "admin-custom-test",
          log_metadata: { campaign_id: campaignId, subject: r.subject, sent_by: admin.email, test: true },
        },
      });
      results.push({
        userId: admin.userId, email: admin.email, name: null,
        emailStatus: error ? "failed" : "sent", emailError: error?.message,
        trial: "not_requested",
      });
      return { campaignId, results };
    }

    if (data.userIds.length === 0) throw new Error("Selecione ao menos um destinatário.");

    for (const userId of data.userIds) {
      const res: SendResult = { userId, email: null, name: null, emailStatus: "no_email", trial: "not_requested" };
      try {
        const { data: u } = await externalAdmin.auth.admin.getUserById(userId);
        const email = u?.user?.email?.toLowerCase() ?? null;
        res.email = email;
        const { data: prof } = await externalAdmin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
        res.name = (prof?.full_name as string | null) ?? null;
        const { data: office } = await externalAdmin
          .from("offices")
          .select("id, name, trial_expires_at")
          .eq("owner_id", userId)
          .maybeSingle();

        // 1) Libera teste grátis (antes do e-mail, para a promessa já valer)
        let validadeIso: string | null = (office?.trial_expires_at as string | null) ?? null;
        if (c.trialDays > 0) {
          if (!office) {
            res.trial = "skipped_no_office";
          } else {
            const { data: active } = await externalAdmin
              .from("subscriptions")
              .select("id")
              .eq("office_id", office.id)
              .eq("status", "active")
              .limit(1);
            if (active && active.length > 0) {
              res.trial = "skipped_active_plan"; // não mexe em quem já paga
            } else {
              validadeIso = new Date(Date.now() + c.trialDays * 86400000).toISOString();
              const { error: upErr } = await externalAdmin
                .from("offices")
                .update({ status: "trial", trial_expires_at: validadeIso })
                .eq("id", office.id);
              res.trial = upErr ? "failed" : "extended";
              res.trialExpiresAt = upErr ? null : validadeIso;
            }
          }
        }

        // 2) E-mail
        if (!email) {
          res.emailStatus = "no_email";
        } else {
          const { data: supp } = await externalAdmin
            .from("suppressed_emails").select("id").eq("email", email).maybeSingle();
          if (supp) {
            res.emailStatus = "suppressed";
          } else {
            const r = await renderEmail(c, {
              nome: firstName(res.name, email),
              email,
              escritorio: (office?.name as string | null) ?? "",
              dias: String(c.trialDays || ""),
              validade: dateBR(validadeIso),
            });
            const { error } = await enqueueEmail({
              payload: {
                message_id: crypto.randomUUID(),
                to: email,
                subject: r.subject,
                html: r.html,
                text: r.text,
                label: "admin-custom",
                idempotency_key: `admin-custom-${campaignId}-${userId}`,
                unsubscribe_token: await getUnsubscribeToken(email),
                log_metadata: {
                  campaign_id: campaignId,
                  subject: r.subject,
                  sent_by: admin.email,
                  user_id: userId,
                  trial_days: c.trialDays,
                  trial_result: res.trial,
                },
              },
            });
            res.emailStatus = error ? "failed" : "sent";
            if (error) res.emailError = error.message;
          }
        }
      } catch (e) {
        res.emailStatus = "failed";
        res.emailError = e instanceof Error ? e.message : String(e);
      }
      results.push(res);
      // Respeita limite de taxa do provedor de e-mail (~2/s no plano grátis do Resend)
      await new Promise((r) => setTimeout(r, 550));
    }

    return { campaignId, results };
  });

// ---------------------------------------------------------------- histórico
export type EmailHistoryRow = {
  createdAt: string;
  to: string;
  subject: string | null;
  status: string;
  error: string | null;
  sentBy: string | null;
  trialDays: number | null;
  trialResult: string | null;
  campaignId: string | null;
};

export const listCustomEmailHistory = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ accessToken: z.string().min(10) }).parse(d))
  .handler(async ({ data }): Promise<{ items: EmailHistoryRow[] }> => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: rows, error } = await externalAdmin
      .from("email_send_log")
      .select("created_at, recipient_email, status, error_message, metadata")
      .eq("template_name", "admin-custom")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const items = ((rows ?? []) as Array<{
      created_at: string; recipient_email: string; status: string; error_message: string | null;
      metadata: Record<string, unknown> | null;
    }>).map((r) => ({
      createdAt: r.created_at,
      to: r.recipient_email,
      subject: (r.metadata?.subject as string) ?? null,
      status: r.status,
      error: r.error_message,
      sentBy: (r.metadata?.sent_by as string) ?? null,
      trialDays: (r.metadata?.trial_days as number) ?? null,
      trialResult: (r.metadata?.trial_result as string) ?? null,
      campaignId: (r.metadata?.campaign_id as string) ?? null,
    }));
    return { items };
  });
