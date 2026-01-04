import { Resend } from 'resend'
import type { EmailAdapter } from 'payload'

const defaultFromAddress = process.env.RESEND_FROM_EMAIL
const defaultFromName = process.env.RESEND_FROM_NAME
const resendApiKey = process.env.RESEND_API_KEY

if (!defaultFromAddress) {
  throw new Error('RESEND_FROM_EMAIL environment variable is required')
}
if (!defaultFromName) {
  throw new Error('RESEND_FROM_NAME environment variable is required')
}
if (!resendApiKey) {
  throw new Error('RESEND_API_KEY environment variable is required')
}

export const resendAdapter: EmailAdapter = ({ payload: _payload }) => {
  const resend = new Resend(resendApiKey)

  return {
    name: 'resend',
    defaultFromAddress,
    defaultFromName,
    async sendEmail(email) {
      try {
        const result = await resend.emails.send({
          from: email.from || defaultFromAddress,
          to: Array.isArray(email.to) ? email.to : [email.to],
          subject: email.subject,
          html: email.html || email.text,
          text: email.text,
          ...(email.replyTo && { reply_to: email.replyTo }),
        })

        if (result.error) {
          throw new Error(result.error.message || 'Failed to send email')
        }

        return {
          id: result.data?.id || 'unknown',
          success: true,
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send email via Resend'
        console.error('Resend email error:', error)
        throw new Error(errorMessage)
      }
    },
  }
}





