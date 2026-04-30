import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { LOGIN } from '@fgc/graphql'
import type { AppRole } from '@fgc/shared'
import type { AuthUser } from './types'

export interface AuthContextValue {
  viewingRole: AppRole | null
  setViewingRole: (r: AppRole | null) => void
  token: string | null
  user: AuthUser | null
  loginWithEmail: (email: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [viewingRole, setViewingRole] = useState<AppRole | null>(null)
  const [token, setToken] = useState<string | null>(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('fgc_token') : null,
  )
  const [user, setUser] = useState<AuthUser | null>(null)

  const [loginMutation] = useMutation(LOGIN)

  const loginWithEmail = useCallback(
    async (email: string) => {
      const res = await loginMutation({ variables: { input: { email } } })
      const payload = res.data?.login
      if (!payload?.token) throw new Error('Login failed')
      setToken(payload.token)
      setUser({
        id: payload.user.id,
        email: payload.user.email,
        name: payload.user.name,
        role: payload.user.role as AppRole,
      })
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('fgc_token', payload.token)
      }
    },
    [loginMutation],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setViewingRole(null)
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('fgc_token')
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      viewingRole,
      setViewingRole,
      token,
      user,
      loginWithEmail,
      logout,
      isAuthenticated: Boolean(token && user),
    }),
    [viewingRole, token, user, loginWithEmail, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
