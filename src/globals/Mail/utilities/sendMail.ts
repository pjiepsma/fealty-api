import type { Mail } from '@/payload-types'
import type { PayloadRequest } from 'payload'
import { slateToHtml, payloadSlateToHtmlConfig } from '@slate-serializers/html'
import { buildHtmlEmailTemplate } from './htmlEmailTemplate'
import { extractObject } from '@/lib/extractID'

type MailOptions = Omit<
  Mail,
  'id' | 'createdAt' | 'updatedAt' | 'headerLogo' | 'footerLogo' | 'fromEmail'
>

type MailTemplateType = keyof MailOptions

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

function getMailTemplate(mail: Mail, type: MailTemplateType): Mail['verify'] | Mail['forgotPassword'] | undefined {
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

function isLexicalFormat(content: unknown): content is { root: { children: unknown[] } } {
  return (
    typeof content === 'object' &&
    content !== null &&
    'root' in content &&
    typeof (content as { root?: unknown }).root === 'object' &&
    (content as { root?: { children?: unknown } }).root !== null &&
    'children' in (content as { root: { children?: unknown } }).root &&
    Array.isArray((content as { root: { children: unknown[] } }).root.children)
  )
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
  const mailGlobal = await req.payload.findGlobal({
    slug: 'mail',
    select: {
      headerLogo: true,
      footerLogo: true,
      [type]: {
        subject: true,
        content: true,
      },
    },
  })

  if (!mailGlobal) {
    throw new Error('Mail global not found')
  }

  // Type guard to ensure we have the Mail structure
  function isMail(obj: unknown): obj is Mail {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'headerLogo' in obj &&
      'footerLogo' in obj &&
      'fromEmail' in obj
    )
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
      throw new Error(`Unsupported content format for mail template "${type}". Expected Slate or Lexical format.`)
    }
    content = buildHtmlBody(contentForHtml, placeholders)
  }

  const headerLogoObj = extractObject(mail.headerLogo)
  const footerLogoObj = extractObject(mail.footerLogo)

  // Type guard for logo objects with sizes
  function getLogoUrl(logo: unknown): string {
    if (!logo) return ''
    if (typeof logo === 'string') return logo
    if (typeof logo === 'object' && logo !== null) {
      const logoObj = logo as { sizes?: { mail?: { url?: string } }; url?: string }
      return logoObj.sizes?.mail?.url || logoObj.url || ''
    }
    return ''
  }

  return {
    subject,
    body: await buildHtmlEmailTemplate({
      title: subject,
      body: content,
      headerLogoUrl: getLogoUrl(headerLogoObj),
      footerLogoUrl: getLogoUrl(footerLogoObj),
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

  // Send email directly using the configured email adapter
  for (const email of to) {
    await req.payload.sendEmail({
      to: email,
      subject,
      html: body,
      ...(bcc && bcc.length > 0 && { bcc }),
    })
  }
}

const buildHtmlBody = (
  content: unknown[],
  placeholders: Record<string, string>,
): string => {
  if (!content || content.length === 0) return ''
  
  const html = slateToHtml(content, {
    ...payloadSlateToHtmlConfig,
    convertLineBreakToBr: true,
  })
  
  return replacePlaceholders(html, placeholders)
}

const replacePlaceholders = (
  content: string,
  placeholders: Record<string, string>,
): string => {
  return Object.entries(placeholders).reduce((acc, [key, value]) => {
    return acc.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }, content)
}
