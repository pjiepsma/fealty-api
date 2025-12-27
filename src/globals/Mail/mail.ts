import { isAdmin } from '@/access/isAdmin'
import type { GlobalConfig } from 'payload'
import { createMailTab } from './utilities/createMailTab'

export const Mail: GlobalConfig = {
  slug: 'mail',
  access: {
    read: isAdmin,
    readVersions: isAdmin,
    update: isAdmin,
  },
  lockDocuments: false,
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'fromEmail',
          label: 'From email address',
          type: 'email',
          required: true,
          defaultValue: 'no-reply@fealty.app',
        },
        {
          name: 'fromName',
          label: 'From name',
          type: 'text',
          required: true,
          defaultValue: 'Fealty',
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        createMailTab({
          label: 'Welcome / Email Verification',
          name: 'verify',
          placeholders: ['name', 'verifyLink'],
          defaultSubject: 'Welkom bij Fealty - Verifieer je e-mailadres',
          defaultContent: 'Hallo {{name}},\n\nWelkom bij Fealty! Verifieer je e-mailadres door op de onderstaande link te klikken:\n\n{{verifyLink}}\n\nAls je geen account hebt aangemaakt, negeer deze e-mail dan.\n\nMet vriendelijke groet,\nHet Fealty Team',
        }),
        createMailTab({
          label: 'Forgot Password',
          name: 'forgotPassword',
          placeholders: ['token', 'origin'],
          defaultSubject: 'Reset je Fealty wachtwoord',
          defaultContent: 'Hallo,\n\nJe hebt gevraagd om je wachtwoord te resetten. Gebruik de volgende token om je wachtwoord te resetten:\n\n{{token}}\n\nOf bezoek: {{origin}}/reset-password?token={{token}}\n\nAls je geen wachtwoordreset hebt aangevraagd, negeer deze e-mail dan.\n\nMet vriendelijke groet,\nHet Fealty Team',
        }),
      ],
    },
  ],
}

