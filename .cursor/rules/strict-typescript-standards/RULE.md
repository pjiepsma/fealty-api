---
description: "Strict TypeScript coding standards: no any, no unknown, no type assertions, no fallbacks"
alwaysApply: true
---

# Strict TypeScript Coding Standards

These are non-negotiable coding standards that must be followed in this codebase.

## Core Rules

### 1. No `any` Type
- **NEVER** use the `any` type
- Use proper TypeScript types from `@/payload-types` or define specific types
- ESLint rule: `@typescript-eslint/no-explicit-any: 'error'` (enforced)

### 2. No `unknown` Type
- **NEVER** use the `unknown` type
- Handle errors with `error instanceof Error` checks instead
- Use proper types instead of `unknown`

### 3. No Type Assertions (`as`)
- **NEVER** use type assertions (`as Type`, `as any`, `as unknown`)
- Use proper TypeScript types instead
- ESLint rule: `@typescript-eslint/consistent-type-assertions: ['error', { assertionStyle: 'never' }]` (enforced)

### 4. No Fallback Operators (`||`)
- **NEVER** use fallback operators for default values (`|| 0`, `|| []`, `|| null`, `|| 5.0`, etc.)
- Use proper null checks and throw errors if values are required
- Handle optional values with proper type guards and conditional logic

### 5. No Overly Broad Union Types
- **NEVER** use union types that combine multiple different primitive types (e.g., `string | number | boolean`)
- Union types combining multiple primitives defeat type safety - a value cannot be a string AND a number at the same time
- Allowed unions:
  - Single type with nullability: `string | null`, `number | null | undefined` (for optional values)
  - Discriminated unions: `'success' | 'error'`, `'admin' | 'user'` (specific string literals)
  - Single type with undefined: `string | undefined` (for optional properties)
- For index signatures or Record types, use a single specific type: `Record<string, string>` not `Record<string, string | number | boolean>`
- If you need multiple types, define specific properties instead of using a union type

## Icons and Emojis

- Do not use icons or emojis like ❌ ✅ 🔒 in code, documentation, or commit messages
- Use clear text descriptions instead (e.g., "BAD", "GOOD")

## Examples

### BAD: Type assertions
```typescript
const config = gameConfig as GameConfig
const value = something as any
```

### GOOD: Proper types
```typescript
import type { GameConfig } from '@/payload-types'

const gameConfig = await payload.findGlobal({ slug: 'game-config' })
if (!gameConfig) {
  throw new Error('Game config not found')
}
// TypeScript infers the type correctly
if (typeof gameConfig.defaultDecayPercentage !== 'number') {
  throw new Error('Game config missing required field: defaultDecayPercentage')
}
const value = gameConfig.defaultDecayPercentage // Properly typed
```

### BAD: Fallback operators
```typescript
const totalSeconds = user.totalSeconds || 0
const percentage = config.percentage || 5.0
```

### GOOD: Proper null checks
```typescript
if (user.totalSeconds === null || user.totalSeconds === undefined || user.totalSeconds <= 0) {
  continue
}
const totalSeconds = user.totalSeconds // TypeScript knows it's a number here

if (!config.percentage) {
  throw new Error('Config missing required field: percentage')
}
const percentage = config.percentage // Properly typed
```

### BAD: `unknown` type
```typescript
catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
}
```

### GOOD: Proper error handling
```typescript
catch (error) {
  if (error instanceof Error) {
    throw new Error(`Operation failed: ${error.message}`)
  }
  throw new Error('Operation failed with unknown error')
}
```

### BAD: Union type with multiple primitive types
```typescript
interface PushNotificationData {
  [key: string]: string | number | boolean | null | undefined
}

type BadType = Record<string, string | number | boolean>
```

### GOOD: Use a single specific type
```typescript
type PushNotificationData = Record<string, string>
```

Or define specific properties if structure is known:
```typescript
interface PushNotificationData {
  type?: string
  id?: string
  value?: number  // Each property has its own specific type
}
```

### GOOD: Legitimate unions (single type with nullability)
```typescript
type OptionalString = string | null | undefined
type UserRole = 'admin' | 'user'  // Discriminated union
type Status = 'active' | 'inactive' | 'pending'  // Specific string literals
```

## Enforcement

These rules are enforced via ESLint configuration in `eslint.config.mjs`:
- `@typescript-eslint/no-explicit-any: 'error'`
- `@typescript-eslint/consistent-type-assertions: ['error', { assertionStyle: 'never' }]`
- `@typescript-eslint/ban-ts-comment: 'error'`

## Build Requirements

1. **Always run lint first**: `pnpm lint`
2. Fix all linting errors
3. Then run build: `pnpm build`
4. Builds must pass with zero violations of these rules
5. Only push code when the build is successful

## Commit Rules

- You are allowed to commit **only if** you have made a successful build before committing
- Do not commit everywhere - only commit when appropriate and after a successful build
- Always run lint first, then build, then commit

## Key Principle

**Use actual TypeScript types, not workarounds.**

- If a type doesn't exist, define it properly
- If a value might be null, handle it explicitly
- If you need a default, throw an error instead of using fallbacks
- Let TypeScript's type system work for you, don't fight it with assertions
