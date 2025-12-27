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
          name: 'headerLogo',
          label: 'Header logo',
          type: 'upload',
          required: true,
          relationTo: 'media',
          hasMany: false,
        },
        {
          name: 'footerLogo',
          label: 'Footer logo',
          type: 'upload',
          required: true,
          relationTo: 'media',
          hasMany: false,
        },
      ],
    },
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
        }),
        createMailTab({
          label: 'Forgot Password',
          name: 'forgotPassword',
          placeholders: ['token', 'origin'],
        }),
      ],
    },
  ],
}

