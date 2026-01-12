import type { Access, AccessArgs, AccessResult, CollectionConfig, PayloadRequest } from 'payload'

type Role = 'user' | 'admin'

export type AccessResultFn = (args: AccessArgs) => AccessResult | Promise<AccessResult>

type AccessCollectionRoles = Role | 'guest'
type FnArgs = { [key in AccessCollectionRoles]?: AccessResultFn }
type AdminFnArgs = { [key in AccessCollectionRoles]?: boolean }
type Args = {
  read?: FnArgs
  readVersions?: FnArgs
  create?: FnArgs
  update?: FnArgs
  delete?: FnArgs
  unlock?: FnArgs
  admin?: AdminFnArgs
}

const accessFn =
  (args: FnArgs | undefined): Access =>
  (accessArgs: AccessArgs): AccessResult | Promise<AccessResult> => {
    if (!accessArgs.req?.user?.role) return args?.guest?.(accessArgs) || false
    const userRole = accessArgs.req.user.role
    if (userRole === 'admin' && args?.[userRole] === undefined) {
      return true
    }
    const roleHandler = userRole === 'user' || userRole === 'admin' ? args?.[userRole] : undefined
    return roleHandler?.(accessArgs) || false
  }

const adminAccessFn = (args: AdminFnArgs | undefined): (({ req }: { req: PayloadRequest }) => boolean | Promise<boolean>) => {
  return ({ req }): boolean | Promise<boolean> => {
    if (!req?.user?.role) return false
    const userRole = req.user.role
    if (userRole === 'admin' && args?.[userRole] === undefined) {
      return true
    }
    const roleAccess = userRole === 'user' || userRole === 'admin' ? args?.[userRole] : undefined
    return roleAccess || false
  }
}

export const accessCollection = (args: Args): CollectionConfig['access'] => {
  return {
    read: accessFn(args.read),
    readVersions: accessFn(args.readVersions),
    create: accessFn(args.create),
    update: accessFn(args.update),
    delete: accessFn(args.delete),
    unlock: accessFn(args.unlock),
    admin: adminAccessFn(args.admin),
  }
}





