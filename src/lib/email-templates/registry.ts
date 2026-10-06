import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
import { template as newDocumentTemplate } from './new-document'
import { template as paymentApprovedTemplate } from './payment-approved'
import { template as trialReminderTemplate } from './trial-reminder'
import { template as materialPurchaseTemplate } from './material-purchase'
import { template as customMessageTemplate } from './custom-message'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'new-document': newDocumentTemplate,
  'payment-approved': paymentApprovedTemplate,
  'trial-reminder': trialReminderTemplate,
  'material-purchase': materialPurchaseTemplate,
  'admin-custom': customMessageTemplate,
}

