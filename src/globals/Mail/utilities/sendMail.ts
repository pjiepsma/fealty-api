import type { Mail, MailSelect } from '@/payload-types'
import type { PayloadRequest } from 'payload'
import { slateToHtml, payloadSlateToHtmlConfig } from '@slate-serializers/html'
import { buildHtmlEmailTemplate } from './htmlEmailTemplate'

type MailTemplateType = 'verify' | 'forgotPassword'

type GenerateMail = {
  subject: string
  body: string
}

type GenerateMailArgs = {
  type: MailTemplateType
  placeholders: Record<string, string>
  req: PayloadRequest
}

type SendMailArgs = GenerateMailArgs & {
  to: string[]
  bcc?: string[]
}

function getMailTemplate(
  mail: Mail,
  type: MailTemplateType,
): Mail['verify'] | Mail['forgotPassword'] | undefined {
  switch (type) {
    case 'verify':
      return mail.verify
    case 'forgotPassword':
      return mail.forgotPassword
    default: {
      const _exhaustive: never = type
      throw new Error(`Invalid mail template type: ${String(_exhaustive)}`)
    }
  }
}

function isSlateFormat(content: unknown): content is unknown[] {
  return Array.isArray(content)
}

function isObjectWithProperty<T extends string>(obj: unknown, prop: T): obj is Record<T, unknown> {
  return typeof obj === 'object' && obj !== null && prop in obj
}

function isLexicalFormat(content: unknown): content is { root: { children: unknown[] } } {
  if (!isObjectWithProperty(content, 'root')) {
    return false
  }
  const root = content.root
  if (!isObjectWithProperty(root, 'children')) {
    return false
  }
  return Array.isArray(root.children)
}

function convertLexicalToSlate(lexicalContent: { root: { children: unknown[] } }): unknown[] {
  // Convert Lexical format to Slate format for slateToHtml
  if (lexicalContent && typeof lexicalContent === 'object' && 'root' in lexicalContent) {
    const root = lexicalContent.root
    if (root && typeof root === 'object' && 'children' in root && Array.isArray(root.children)) {
      return root.children
    }
    throw new Error('Invalid Lexical content structure: root.children is not an array')
  }
  throw new Error('Invalid Lexical content structure: missing root property')
}

export const generateMail = async ({
  type,
  placeholders,
  req,
}: GenerateMailArgs): Promise<GenerateMail> => {
  // Build select object dynamically based on type
  const selectFields: MailSelect<true> =
    type === 'verify'
      ? {
          verify: {
            subject: true,
            content: true,
          },
        }
      : {
          forgotPassword: {
            subject: true,
            content: true,
          },
        }

  const mailGlobal = await req.payload.findGlobal({
    slug: 'mail',
    select: selectFields,
  })

  if (!mailGlobal) {
    throw new Error('Mail global not found')
  }

  // Type guard to ensure we have the Mail structure
  function isMail(obj: unknown): obj is Mail {
    return typeof obj === 'object' && obj !== null && 'fromEmail' in obj
  }

  if (!isMail(mailGlobal)) {
    throw new Error('Mail global has invalid structure')
  }

  const mail = mailGlobal
  const mailTemplate = getMailTemplate(mail, type)

  if (!mailTemplate) {
    throw new Error(`Mail template "${type}" not found`)
  }

  const subject = replacePlaceholders(mailTemplate.subject || '', placeholders)

  let content = ''
  if (mailTemplate.content) {
    let contentForHtml: unknown[]
    if (isSlateFormat(mailTemplate.content)) {
      contentForHtml = mailTemplate.content
    } else if (isLexicalFormat(mailTemplate.content)) {
      contentForHtml = convertLexicalToSlate(mailTemplate.content)
    } else {
      throw new Error(
        `Unsupported content format for mail template "${type}". Expected Slate or Lexical format.`,
      )
    }
    content = buildHtmlBody(contentForHtml, placeholders)
  }

  return {
    subject,
    body: await buildHtmlEmailTemplate({
      title: subject,
      body: content,
    }),
  }
}

export const sendMail = async ({
  type,
  placeholders,
  req,
  to,
  bcc,
}: SendMailArgs): Promise<void> => {
  const { subject, body } = await generateMail({ type, placeholders, req })

  // Get fromEmail and fromName from Mail global (configured in Payload UI)
  const mailGlobal = await req.payload.findGlobal({
    slug: 'mail',
    select: {
      fromEmail: true,
      fromName: true,
    },
  })

  // Format "From" field: "Name <email@example.com>" or just email
  let fromField: string | undefined
  if (mailGlobal?.fromEmail) {
    if (mailGlobal.fromName) {
      fromField = `${mailGlobal.fromName} <${mailGlobal.fromEmail}>`
    } else {
      fromField = mailGlobal.fromEmail
    }
  }

  // Send email directly using the configured email adapter
  for (const email of to) {
    await req.payload.sendEmail({
      to: email,
      subject,
      html: body,
      ...(fromField && { from: fromField }), // Use fromEmail/fromName from Mail global if available
      ...(bcc && bcc.length > 0 && { bcc }),
    })
  }
}

const buildHtmlBody = (content: unknown[], placeholders: Record<string, string>): string => {
  if (!content || content.length === 0) return ''

  const html = slateToHtml(content, {
    ...payloadSlateToHtmlConfig,
    convertLineBreakToBr: true,
  })

  return replacePlaceholders(html, placeholders)
}

const replacePlaceholders = (content: string, placeholders: Record<string, string>): string => {
  return Object.entries(placeholders).reduce((acc, [key, value]) => {
    return acc.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }, content)
}
