/**
 * Authentication migration notes.
 *
 * Legacy auth-context.tsx is kept temporarily for UI compatibility.
 * New code should use:
 * - lib/auth/session.ts
 * - lib/auth/user.ts
 * - lib/auth/permissions.ts
 *
 * This file prevents introducing new direct localStorage authentication flows.
 */
export const AUTH_MIGRATION_COMPLETE = false
