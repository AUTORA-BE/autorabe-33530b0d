/**
 * Envoi d'email applicatif via l'API email managée de Lovable, avec
 * journalisation dans `email_send_log` et alerte ops en cas d'échec.
 *
 * La livraison, les relances, la suppression et le désabonnement sont gérés
 * par Lovable — ce module ne fait que tracer le résultat côté application.
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  sendTemplateEmail,
  type SendTemplateEmailOptions,
  type SendTemplateEmailResult,
} from './transactional-email-templates/send-email.ts'
import { logOpsAlert } from './opsAlert.ts'

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )
}

async function log(
  templateName: string,
  recipient: string,
  status: 'sent' | 'suppressed' | 'failed',
  errorMessage?: string,
): Promise<void> {
  try {
    const { error } = await adminClient().from('email_send_log').insert({
      message_id: null,
      template_name: templateName,
      recipient_email: recipient,
      status,
      error_message: errorMessage ?? null,
    })
    if (error) {
      console.error('email_send_log insert failed', { code: error.code, message: error.message })
    }
  } catch (e) {
    console.error('email_send_log insert threw', e instanceof Error ? e.message : String(e))
  }
}

/**
 * Envoie un template enregistré et trace le résultat.
 * Ne lève jamais : retourne `{ sent: false, reason }` en cas d'échec.
 */
export async function sendTemplateEmailLogged(
  templateName: string,
  recipient: string,
  options: SendTemplateEmailOptions = {},
): Promise<SendTemplateEmailResult | { sent: false; reason: 'send_failed' }> {
  try {
    const result = await sendTemplateEmail(templateName, recipient, options)
    if (result.sent) {
      await log(templateName, recipient, 'sent')
    } else {
      await log(templateName, recipient, 'suppressed')
    }
    return result
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Email send failed', { templateName, error: errorMsg })
    await log(templateName, recipient, 'failed', errorMsg.slice(0, 1000))
    await logOpsAlert('send-email', `Envoi d'email échoué: ${errorMsg.slice(0, 300)}`, {
      severity: 'error',
      context: { template: templateName },
    })
    return { sent: false, reason: 'send_failed' }
  }
}
