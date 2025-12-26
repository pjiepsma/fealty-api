import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'

type GenerateEmailBodyArgs = {
  title: string
  body: string
  headerLogoUrl: string
  footerLogoUrl: string
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export async function buildHtmlEmailTemplate({
  title,
  body,
  headerLogoUrl,
  footerLogoUrl,
}: GenerateEmailBodyArgs): Promise<string> {
  const template = await readHtmlTemplate()

  return template
    .replace('[[title]]', title)
    .replace('[[content]]', body)
    .replace('[[headerLogo]]', headerLogoUrl || '')
    .replaceAll('[[footerLogo]]', footerLogoUrl || '')
    .replaceAll('[[origin]]', process.env.PAYLOAD_PUBLIC_APP_DEEP_LINK || process.env.PAYLOAD_PUBLIC_SERVER_URL || process.env.PAYLOAD_SERVER_URL || '')
}

async function readHtmlTemplate(): Promise<string> {
  const templatePath = path.resolve(dirname, 'templates/html/index.html')
  return readFile(templatePath, 'utf-8')
}

