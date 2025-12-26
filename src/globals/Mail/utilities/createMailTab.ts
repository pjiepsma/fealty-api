import type { Tab } from 'payload'

type CreateMailTabArgs = {
  label: string
  name: string
  placeholders: string[]
}

function mailTabDescription(placeholders: string[]): string {
  const formattedPlaceholders = placeholders.reduce((acc, placeholder, index) => {
    return `${acc}${index === 0 ? '' : ', '}{{${placeholder}}}`
  }, '')

  return `Use the following placeholders to insert dynamic values: ${formattedPlaceholders}`
}

export const createMailTab = ({ label, name, placeholders }: CreateMailTabArgs): Tab => ({
  name,
  label,
  fields: [
    {
      name: 'subject',
      label: 'Subject',
      type: 'text',
      admin: {
        description: mailTabDescription(placeholders),
      },
    },
    {
      name: 'content',
      label: 'Content',
      type: 'richText',
      admin: {
        description: mailTabDescription(placeholders),
      },
    },
  ],
})

