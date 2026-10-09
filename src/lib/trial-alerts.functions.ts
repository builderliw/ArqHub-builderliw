import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ListSchema = z.object({ accessToken: z.string().min(10) });
const SendSchema = z.object({
  accessToken: z.string().min(10),
  userId: z.string().uuid(),
});

export type TrialAlertRow = {
  userId: string;
  fullName: string | null;
  email: string | null;
  officeId: string;
  officeName: string | null;
  trialExpiresAt: string;
  daysLeft: number;
  hoursLeft: number;
  bucket: "d1" | "d7" | "d14";
  lastReminderAt: string | null;
  lastReminderStatus: string | null;
};

function addDaysIso(iso: string | null | undefined, days: number): string | null {
  if (!iso) return null;
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return null;
  return new Date(start + days * 86400000).toISOString();
}

function classifyPlanCode(code: string | null): "premium" | "basico" | "enterprise" | null {
  if (!code) return null;
  const c = code.toLowerCase();
  if (c.includes("enterprise")) return "enterprise";
  if (c.includes("premium")) return "premium";
  if (c.includes("basic") || c.includes("basico") || c.includes("básico")) return "basico";
  return null;
}

export const listTrialAlerts = createServerFn({ method: "POST" })
  .inputValidator((d) => ListSchema.parse(d))
  .handler(async ({ data }): Promise<{ items: TrialAlertRow[] }> => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");

    const now = Date.now();
    const { data: offices, error } = await externalAdmin
      .from("offices")
      .select("id, name, owner_id, trial_expires_at, status, created_at");
    if (error) throw new Error(error.message);

    const officeRows = (offices ?? []) as Array<{
      id: string; name: string | null; owner_id: string;
      trial_expires_at: string | null; status: string | null; created_at: string | null;
    }>;
    if (!officeRows.length) return { items: [] };

    const officeIds = officeRows.map((r) => r.id);
    const [{ data: subs }, { data: plans }] = await Promise.all([
      externalAdmin
        .from("subscriptions")
        .select("office_id, plan_id, status")
        .in("office_id", officeIds),
      externalAdmin.from("plans").select("id, code"),
    ]);
    const planCodeById = new Map<string, string>(
      ((plans ?? []) as Array<{ id: string; code: string }>).map((p) => [p.id, p.code]),
    );
    const subByOffice = new Map<string, { office_id: string; plan_id: string | null; status: string | null }>();
    ((subs ?? []) as Array<{ office_id: string; plan_id: string | null; status: string | null }>).forEach((s) => {
      subByOffice.set(s.office_id, s);
    });

    const filtered = officeRows
      .map((r) => {
        const sub = subByOffice.get(r.id);
        const planCode = sub?.plan_id ? planCodeById.get(sub.plan_id) ?? null : null;
        const codeKind = classifyPlanCode(planCode);
        const paidOrClosed = (sub?.status === "active" && codeKind) || r.status === "expired" || r.status === "canceled";
        const trialExpiresAt = r.trial_expires_at ?? addDaysIso(r.created_at, 14);
        return { ...r, trial_expires_at: trialExpiresAt, paidOrClosed };
      })
      .filter((r) => {
        if (r.paidOrClosed || !r.trial_expires_at) return false;
        const end = new Date(r.trial_expires_at).getTime();
        return !Number.isNaN(end) && end >= now;
      }) as Array<{
        id: string; name: string | null; owner_id: string;
        trial_expires_at: string; status: string | null;
      }>;

    const ownerIds = Array.from(new Set(filtered.map((r) => r.owner_id)));
    const { data: profiles } = await externalAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", ownerIds);
    const nameById = new Map<string, string | null>(
      ((profiles ?? []) as Array<{ id: string; full_name: string | null }>).map((p) => [p.id, p.full_name]),
    );

    // Fetch emails via auth admin (one call per user)
    const emailById = new Map<string, string | null>();
    await Promise.all(
      ownerIds.map(async (uid) => {
        try {
          const { data } = await externalAdmin.auth.admin.getUserById(uid);
          emailById.set(uid, data?.user?.email ?? null);
        } catch {
          emailById.set(uid, null);
        }
      }),
    );

    // Last reminder log per recipient (email_send_log no Supabase yknwdpyaevodvonvhadt)
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const emails = Array.from(new Set(Array.from(emailById.values()).filter(Boolean))) as string[];
    const lastByEmail = new Map<string, { at: string; status: string }>();
    if (emails.length) {
      const { data: logs } = await supabaseAdmin
        .from("email_send_log")
        .select("recipient_email, status, created_at")
        .eq("template_name", "trial-reminder")
        .in("recipient_email", emails)
        .order("created_at", { ascending: false });
      for (const row of (logs ?? []) as Array<{ recipient_email: string; status: string; created_at: string }>) {
        if (!lastByEmail.has(row.recipient_email)) {
          lastByEmail.set(row.recipient_email, { at: row.created_at, status: row.status });
        }
      }
    }

    const items: TrialAlertRow[] = filtered.map((r) => {
      const endMs = new Date(r.trial_expires_at).getTime();
      const diffMs = Math.max(0, endMs - now);
      const daysLeft = Math.floor(diffMs / 86400000);
      const hoursLeft = Math.floor((diffMs % 86400000) / 3600000);
      const bucket: "d1" | "d7" | "d14" = daysLeft <= 1 ? "d1" : daysLeft <= 7 ? "d7" : "d14";
      const email = emailById.get(r.owner_id) ?? null;
      const last = email ? lastByEmail.get(email) : undefined;
      return {
        userId: r.owner_id,
        fullName: nameById.get(r.owner_id) ?? null,
        email,
        officeId: r.id,
        officeName: r.name,
        trialExpiresAt: r.trial_expires_at,
        daysLeft,
        hoursLeft,
        bucket,
        lastReminderAt: last?.at ?? null,
        lastReminderStatus: last?.status ?? null,
      };
    });

    items.sort((a, b) => new Date(a.trialExpiresAt).getTime() - new Date(b.trialExpiresAt).getTime());
    return { items };
  });

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const sendTrialReminder = createServerFn({ method: "POST" })
  .inputValidator((d) => SendSchema.parse(d))
  .handler(async ({ data }) => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");

    const { data: office, error: officeErr } = await externalAdmin
      .from("offices")
      .select("id, name, trial_expires_at, owner_id")
      .eq("owner_id", data.userId)
      .maybeSingle();
    if (officeErr) throw new Error(officeErr.message);
    if (!office || !office.trial_expires_at) throw new Error("Usuário sem teste ativo.");

    const { data: prof } = await externalAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", data.userId)
      .maybeSingle();

    const { data: userInfo } = await externalAdmin.auth.admin.getUserById(data.userId);
    const email = userInfo?.user?.email;
    if (!email) throw new Error("Usuário sem e-mail cadastrado.");

    const endMs = new Date(office.trial_expires_at as string).getTime();
    const diffMs = endMs - Date.now();
    const daysLeft = Math.max(0, Math.floor(diffMs / 86400000));
    const expiresAt = new Date(office.trial_expires_at as string).toLocaleDateString("pt-BR");
    const firstName = (prof?.full_name ?? "").toString().split(" ")[0] || null;

    // Render + enqueue directly via Lovable Cloud service role
    const React = (await import("react")).default;
    const { render } = await import("@react-email/components");
    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    const template = TEMPLATES["trial-reminder"];
    if (!template) throw new Error("Template não registrado");

    const templateData = { name: firstName, daysLeft, expiresAt };
    const element = React.createElement(template.component, templateData);
    const html = await render(element);
    const text = await render(element, { plainText: true });
    const subject =
      typeof template.subject === "function" ? template.subject(templateData) : template.subject;

    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const normalized = email.toLowerCase();

    // Suppression check
    const { data: suppressed } = await supabaseAdmin
      .from("suppressed_emails")
      .select("id")
      .eq("email", normalized)
      .maybeSingle();
    if (suppressed) {
      return { ok: false, reason: "email_suppressed" as const };
    }

    // Ensure unsubscribe token exists
    const { data: existingToken } = await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .select("token, used_at")
      .eq("email", normalized)
      .maybeSingle();
    let unsubscribeToken: string;
    if (existingToken && !existingToken.used_at) {
      unsubscribeToken = existingToken.token as string;
    } else {
      unsubscribeToken = generateToken();
      await supabaseAdmin
        .from("email_unsubscribe_tokens")
        .upsert({ token: unsubscribeToken, email: normalized }, { onConflict: "email", ignoreDuplicates: true });
      const { data: stored } = await supabaseAdmin
        .from("email_unsubscribe_tokens")
        .select("token")
        .eq("email", normalized)
        .maybeSingle();
      unsubscribeToken = (stored?.token as string) || unsubscribeToken;
    }

    const messageId = crypto.randomUUID();
    const idempotencyKey = `trial-reminder-${data.userId}-${new Date().toISOString().slice(0, 10)}`;

    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: "trial-reminder",
      recipient_email: email,
      status: "pending",
    });

    const { enqueueEmail } = await import("@/lib/email-send.server");
    const { error: enqueueError } = await enqueueEmail({
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: email,
        from: "arqhub-pro-suite <noreply@notify.arqhub.world>",
        sender_domain: "notify.arqhub.world",
        subject,
        html,
        text,
        purpose: "transactional",
        label: "trial-reminder",
        idempotency_key: idempotencyKey,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    });
    if (enqueueError) {
      await supabaseAdmin.from("email_send_log").insert({
        message_id: messageId,
        template_name: "trial-reminder",
        recipient_email: email,
        status: "failed",
        error_message: enqueueError.message,
      });
      throw new Error(enqueueError.message);
    }

    return { ok: true, queued: true, email };
  });
