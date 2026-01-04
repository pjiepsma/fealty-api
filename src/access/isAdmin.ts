import { hasRole } from './hasRole'
import type { PayloadRequest } from 'payload'

export const isAdmin = hasRole(['admin'])

// Wrapper for admin property in access config (different signature than regular access functions)
export const isAdminForAccess = ({ req }: { req: PayloadRequest }): boolean => {
  if (!req?.user?.role) return false
  return req.user.role === 'admin'
}





