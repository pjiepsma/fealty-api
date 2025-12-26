import type { Access } from 'payload'

export const hasRole = (roles: string[]): Access => {
  return ({ req: { user } }) => {
    if (!user) return false
    return roles.includes(user.role as string)
  }
}

