import { existsSync, mkdirSync, writeFile } from 'fs'
import path from 'path'
import type { EmailAdapter } from 'payload'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default function getDevEmailAdapter(): EmailAdapter | Promise<EmailAdapter> | undefined {
  return () => {
    return {
      defaultFromAddress: 'dev@fealty.app',
      defaultFromName: 'Fealty Dev',
      name: 'Dev Email Adapter',
      sendEmail: async ({ to, subject, html }) => {
        console.log('------------- DEV EMAIL ADAPTER --------------')
        console.log('Sending email to:', to)
        console.log('Subject:', subject)
        console.log('HTML:', html)
        console.log('----------------------------------------------')

        const emailsDir = path.resolve(dirname, '../../../emails')
        if (!existsSync(emailsDir)) {
          mkdirSync(emailsDir)
        }

        writeFile(
          path.resolve(emailsDir, `${Date.now()}.html`),
          html,
          { flag: 'wx' },
          () => {},
        )
      },
    }
  }
}

