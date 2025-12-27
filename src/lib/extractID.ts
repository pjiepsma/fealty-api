export const extractID = <T extends { id: string }>(
  objectOrID: T | T['id'],
): T['id'] => {
  return objectOrID && typeof objectOrID === 'object' ? objectOrID.id : objectOrID
}

export const extractObject = <T>(
  objectOrID: T | string,
): T | undefined => {
  return typeof objectOrID === 'object' ? objectOrID : undefined
}

