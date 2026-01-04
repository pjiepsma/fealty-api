import type { Tab } from 'payload'

type CreateMailTabArgs = {
  label: string
  name: string
  placeholders: string[]
  defaultSubject?: string
  defaultContent?: string
}

function mailTabDescription(placeholders: string[]): string {
  const formattedPlaceholders = placeholders.reduce((acc, placeholder, index) => {
    return `${acc}${index === 0 ? '' : ', '}{{${placeholder}}}`
  }, '')

  return `Use the following placeholders to insert dynamic values: ${formattedPlaceholders}`
}

function textToLexical(text: string): { root: { children: Array<{ children: Array<{ text: string; type: string }>; type: string; version: number }>; direction: string; format: string; indent: number; type: string; version: number } } {
  // Convert plain text to Lexical format
  const lines = text.split('\n')
  const children = lines.map((line) => ({
    children: line ? [{ text: line, type: 'text' }] : [],
    type: 'paragraph',
    version: 1,
  }))

  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

export const createMailTab = ({ label, name, placeholders, defaultSubject, defaultContent }: CreateMailTabArgs): Tab => ({
  name,
  label,
  fields: [
    {
      name: 'subject',
      label: 'Subject',
      type: 'text',
      defaultValue: defaultSubject,
      admin: {
        description: mailTabDescription(placeholders),
      },
    },
    {
      name: 'content',
      label: 'Content',
      type: 'richText',
      defaultValue: defaultContent ? textToLexical(defaultContent) : undefined,
      admin: {
        description: mailTabDescription(placeholders),
      },
    },
  ],
})





