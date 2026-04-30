import type { AppRole } from '@fgc/shared'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: AppRole
}

export interface AuthState {
  /** Demo / session role (who is viewing the app) */
  viewingRole: AppRole | null
  token: string | null
  user: AuthUser | null
}
