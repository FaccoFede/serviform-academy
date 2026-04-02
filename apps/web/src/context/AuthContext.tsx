'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  role: string
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const TOKEN_KEY = 'sa_token'

// Interceptor globale: cattura 401 SOLO se non è l'endpoint di login/register
// In questo modo un completamento modulo che restituisce 401 non causa logout
let globalLogoutHandler: (() => void) | null = null

export function setupAuthInterceptor(logoutFn: () => void) {
  globalLogoutHandler = logoutFn
}

/**
 * fetchWithAuth - wrapper che aggiunge il token e gestisce 401.
 * NON fa logout automatico: restituisce la risposta e lascia che il chiamante decida.
 * Questo previene il logout involontario durante il completamento di un modulo.
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  token: string | null,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = 'Bearer ' + token

  const res = await fetch(url, { ...options, headers })

  // 401 su endpoint progress/certificates: NON fare logout, rilanciare l'errore
  // 401 su /auth/profile: il token è scaduto, logout
  if (res.status === 401) {
    const path = new URL(url, 'http://localhost').pathname
    const isCritical = path.startsWith('/auth/profile')
    if (isCritical && globalLogoutHandler) {
      globalLogoutHandler()
    }
  }

  return res
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // Registra il logout globale per l'interceptor
  useEffect(() => {
    setupAuthInterceptor(logout)
  }, [logout])

  const loadProfile = useCallback(async (t: string) => {
    try {
      const res = await fetch(API_URL + '/auth/profile', {
        headers: { Authorization: 'Bearer ' + t },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        return true
      }
      // Token scaduto o invalido
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      }
    } catch {}
    return false
  }, [])

  // Bootstrap: carica il token dal localStorage all'avvio
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored) {
      setToken(stored)
      loadProfile(stored).finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [loadProfile])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(API_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Credenziali non valide')
    }
    const data = await res.json()
    const t = data.accessToken
    localStorage.setItem(TOKEN_KEY, t)
    setToken(t)
    setUser(data.user || data)
  }, [])

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const res = await fetch(API_URL + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Errore durante la registrazione')
    }
    const data = await res.json()
    const t = data.accessToken
    localStorage.setItem(TOKEN_KEY, t)
    setToken(t)
    setUser(data.user || data)
  }, [])

  const refreshUser = useCallback(async () => {
    if (token) await loadProfile(token)
  }, [token, loadProfile])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
