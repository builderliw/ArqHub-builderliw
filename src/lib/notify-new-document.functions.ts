import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'

const SITE_NAME = 'arqhub-pro-suite'
const SENDER_DOMAIN = 'notify.arqhub.world'
const FROM_DOMAIN = 'notify.arqhub.world'
const EXTERNAL_URL = 'https://yknwdpyaevodvonvhadt.supabase.co'

const InputSchema = z.object({
  externalAccessToken: z.string().min(10).max(4096),
  projectId: z.string().uuid(),
  documentName: z.string().min(1).max(512),
})

export const notifyNewClientDocument = createServerFn({ method: 'POST' })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const externalSrk = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY
    if (!externalSrk) {
      return { ok: false, reason: 'server_misconfigured' as const }
    }

    const ext = createClient(EXTERNAL_URL, externalSrk, { auth: { persistSession: false } })
    // 1) Validate caller against external supabase
    const { data: userRes, error: authErr } = await ext.auth.getUser(data.externalAccessToken)
    if (authErr || !userRes?.user) return { ok: false, reason: 'unauthorized' as const }
    const callerId = userRes.user.id

    // 2) Read project + verify ownership (office owner or responsible)
    const { data: proj } = await ext
      .from('projects')
      .select('id, name, office_id, client_id, responsible_id')
      .eq('id', data.projectId)
      .maybeSingle()
    if (!proj) return { ok: false, reason: 'project_not_found' as const }

    const { data: office } = await ext
      .from('offices')
      .select('id, name, owner_id, plan_id')
      .eq('id', proj.office_id)
      .maybeSingle()
    if (!office) return { ok: false, reason: 'office_not_found' as const }

    const isOwner = office.owner_id === callerId || proj.responsible_id === callerId
    if (!isOwner) return { ok: false, reason: 'forbidden' as const }

    // 3) Client email
    const { data: client } = await ext
      .from('clients')
      .select('id, name, email')
      .eq('id', proj.client_id)
      .maybeSingle()
    if (!client?.email) return { ok: false, reason: 'no_client_email' as const }
    const recipientEmail = String(client.email).toLowerCase()

    // 4) Plan + per-user preferences (mesmo banco yknwdpyaevodvonvhadt)
    const lov = ext

    let planCode: string | null = null
    if (office.plan_id) {
      const { data: plan } = await ext
        .from('plans')
        .select('code')
        .eq('id', office.plan_id)
        .maybeSingle()
      planCode = plan?.code ?? null
    }
    if (planCode) {
      const { data: planPref } = await lov
        .from('plan_notification_settings')
        .select('new_document')
        .eq('plan_code', planCode)
        .maybeSingle()
      if (planPref && planPref.new_document === false) {
        return { ok: false, reason: 'disabled_by_plan' as const }
      }
    }

    const { data: userPref } = await lov
      .from('notification_preferences')
      .select('new_document')
      .eq('user_email', recipientEmail)
      .maybeSingle()
    if (userPref && userPref.new_document === false) {
      return { ok: false, reason: 'disabled_by_user' as const }
    }

    // 5) Suppression list
    const { data: supp } = await lov
      .from('suppressed_emails')
      .select('email')
      .eq('email', recipientEmail)
      .maybeSingle()
    if (supp) return { ok: false, reason: 'email_suppressed' as const }

    // 6) Render and enqueue
    const { TEMPLATES } = await import('@/lib/email-templates/registry')
    const tpl = TEMPLATES['new-document']
    if (!tpl) return { ok: false, reason: 'template_missing' as const }

    const templateData = {
      clientName: client.name ?? null,
      projectName: proj.name ?? null,
      documentName: data.documentName,
      documentsCount: 1,
      officeName: office.name ?? null,
      panelUrl: 'https://arqhub.world/app/cliente/documentos',
    }

    // Unsubscribe token (upsert)
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0')).join('')
    await lov.from('email_unsubscribe_tokens').upsert(
      { email: recipientEmail, token },
      { onConflict: 'email', ignoreDuplicates: true },
    )
    const { data: storedTok } = await lov
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', recipientEmail)
      .maybeSingle()
    const unsubscribeToken = storedTok?.token ?? token

    const element = React.createElement(tpl.component, templateData)
    const html = await render(element)
    const plainText = await render(element, { plainText: true })
    const subject = typeof tpl.subject === 'function' ? tpl.subject(templateData) : tpl.subject

    const messageId = crypto.randomUUID()
    const idempotencyKey = `new-document-${data.projectId}-${data.documentName}-${messageId}`

    await lov.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'new-document',
      recipient_email: recipientEmail,
      status: 'pending',
    })

    const { enqueueEmail } = await import('@/lib/email-send.server')
    const { error: qErr } = await enqueueEmail({
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: recipientEmail,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text: plainText,
        purpose: 'transactional',
        label: 'new-document',
        idempotency_key: idempotencyKey,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    })
    if (qErr) {
      await lov.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'new-document',
        recipient_email: recipientEmail,
        status: 'failed',
        error_message: 'Failed to enqueue',
      })
      // continue to push even if email enqueue failed
    }

    // 7) Web Push notifications (PWA) — best effort
    try {
      const { data: subs } = await lov
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_email', recipientEmail)
      if (subs && subs.length > 0) {
        const { sendWebPush } = await import('@/lib/web-push.server')
        const pushPayload = {
          title: `Novo documento — ${proj.name ?? 'Projeto'}`,
          body: data.documentName,
          url: 'https://arqhub.world/app/cliente/documentos',
          tag: `new-doc-${data.projectId}`,
          badge: 1,
          icon: 'https://arqhub.world/icons/icon-192.png',
        }
        const results = await Promise.all(
          subs.map((s) => sendWebPush(
            { endpoint: s.endpoint as string, p256dh: s.p256dh as string, auth: s.auth as string },
            pushPayload,
          )),
        )
        const goneEndpoints = subs
          .filter((_, i) => results[i]?.removed)
          .map((s) => s.endpoint as string)
        if (goneEndpoints.length > 0) {
          await lov.from('push_subscriptions').delete().in('endpoint', goneEndpoints)
        }
      }
    } catch (e) {
      console.warn('[push] send failed:', e)
    }

    return { ok: true as const }
  })


// --- Preferences API (called by signed-in client) ---

export const getMyNotificationPrefs = createServerFn({ method: 'POST' })
  .inputValidator((d: { externalAccessToken: string }) => ({
    externalAccessToken: z.string().min(10).max(4096).parse(d.externalAccessToken),
  }))
  .handler(async ({ data }) => {
    const externalSrk = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY
    if (!externalSrk) return { email: null, new_document: true }
    const ext = createClient(EXTERNAL_URL, externalSrk, { auth: { persistSession: false } })
    const { data: u } = await ext.auth.getUser(data.externalAccessToken)
    const email = u?.user?.email?.toLowerCase() ?? null
    if (!email) return { email: null, new_document: true }
    const lov = ext
    const { data: pref } = await lov
      .from('notification_preferences')
      .select('new_document')
      .eq('user_email', email)
      .maybeSingle()
    return { email, new_document: pref?.new_document ?? true }
  })

export const setMyNotificationPrefs = createServerFn({ method: 'POST' })
  .inputValidator((d: { externalAccessToken: string; new_document: boolean }) => ({
    externalAccessToken: z.string().min(10).max(4096).parse(d.externalAccessToken),
    new_document: z.boolean().parse(d.new_document),
  }))
  .handler(async ({ data }) => {
    const externalSrk = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY
    if (!externalSrk) return { ok: false as const }
    const ext = createClient(EXTERNAL_URL, externalSrk, { auth: { persistSession: false } })
    const { data: u } = await ext.auth.getUser(data.externalAccessToken)
    const email = u?.user?.email?.toLowerCase() ?? null
    if (!email) return { ok: false as const }
    const lov = ext
    await lov.from('notification_preferences').upsert(
      { user_email: email, new_document: data.new_document, updated_at: new Date().toISOString() },
      { onConflict: 'user_email' },
    )
    return { ok: true as const }
  })
