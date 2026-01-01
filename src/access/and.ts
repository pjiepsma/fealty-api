import type { Access, AccessArgs, AccessResult } from 'payload'

export const and = (validations: Access[]): Access => async (args: AccessArgs): Promise<AccessResult | boolean> => {
  let accessResult: AccessResult = true

  for (let i = 0; i < validations.length; i++) {
    const valid = await validations[i](args)
    if (!valid) {
      accessResult = false
      break
    }
    if (valid === true) continue
    accessResult = {
      ...(typeof accessResult === 'boolean' ? {} : accessResult),
      ...valid,
    }
  }

  return accessResult
}



