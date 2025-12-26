import type { CollectionSlug, Config } from 'payload'
import type { Payload } from 'payload'

type ConfigType = Config

export const extractID = <T extends ConfigType['collections'][CollectionSlug]>(
  objectOrID: T | T['id'],
): T['id'] => {
  return objectOrID && typeof objectOrID === 'object' ? objectOrID.id : objectOrID
}

export const extractObject = <T>(
  objectOrID: T | string,
): T | undefined => {
  return typeof objectOrID === 'object' ? objectOrID : undefined
}

