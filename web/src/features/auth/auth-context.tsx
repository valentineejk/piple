import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { setOnAuthFailure, tokenStore } from '@/lib/api'
import { authService, usersService } from '@/lib/services'
import type { Role, User } from '@/types/api'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  role: Role | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    if (!tokenStore.access) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await usersService.me()
      setUser(me)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUser()
  }, [loadUser])

  useEffect(() => {
    // When a refresh ultimately fails, drop the user so routes redirect.
    setOnAuthFailure(() => {
      setUser(null)
    })
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await authService.login(email, password)
      tokenStore.set(tokens.access_token, tokens.refresh_token)
      const me = await usersService.me()
      setUser(me)
    },
    [],
  )

  const logout = useCallback(async () => {
    const refresh = tokenStore.refresh
    try {
      if (refresh) await authService.logout(refresh)
    } catch {
      // ignore — clear locally regardless
    }
    tokenStore.clear()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      role: (user?.role as Role) ?? null,
      login,
      logout,
      refreshUser: loadUser,
    }),
    [user, loading, login, logout, loadUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
