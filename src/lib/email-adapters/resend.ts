import { resendAdapter } from '@payloadcms/email-resend'

export async function getResendAdapter() {
  return resendAdapter({
    defaultFromAddress: process.env.EMAIL_FROM_ADDRESS ?? process.env.MAIL_FROM_ADDRESS ?? 'no-reply@fealty.app',
    defaultFromName: process.env.EMAIL_FROM_NAME ?? process.env.MAIL_FROM_NAME ?? 'Fealty',
    apiKey: process.env.MAIL_API_KEY ?? process.env.RESEND_API_KEY ?? '',
  })
}

