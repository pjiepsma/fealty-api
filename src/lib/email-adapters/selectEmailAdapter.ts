import getDevEmailAdapter from './consoleLog'
import { getResendAdapter } from './resend'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { EmailAdapter } from 'payload'

export function getSelectedEmailAdapter(): EmailAdapter | Promise<EmailAdapter> | undefined {
  const adapter = process.env.MAIL_ADAPTER

  if (adapter === 'resend') {
    return getResendAdapter()
  }

  if (adapter === 'staging') {
    return nodemailerAdapter()
  }

  return getDevEmailAdapter()
}

