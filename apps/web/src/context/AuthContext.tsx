'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface AuthUser {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  role: 'USER' | 'ADMIN' | 'TEAM_ADMIN'
  company?: { id: string; name: string; slug: string } | null
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Sicuro: solo client-side
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sa_token') : null
    if (saved) {
      setToken(saved)
      fetchProfile(saved)
    } else {
      setIsLoading(false)
    }
  }, [])

  async function fetchProfile(t: string) {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: 'Bearer ' + t },
      })
      if (res.ok) {
        const data = await res.json()
        setUser({
          ...data,
          company: data.membership?.company ?? null,
        })
        setToken(t)
      } else {
        if (typeof window !== 'undefined') localStorage.removeItem('sa_token')
      }
    } catch {
      // network error — mantieni loading false
    } finally {
      setIsLoading(false)
    }
  }

  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Credenziali non valide')
    }
    const data = await res.json()
    const u: AuthUser = { ...data.user, company: data.user.company ?? null }
    setToken(data.accessToken)
    setUser(u)
    if (typeof window !== 'undefined') localStorage.setItem('sa_token', data.accessToken)
  }

  async function register(email: string, password: string, name?: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Errore di registrazione')
    }
    const data = await res.json()
    setToken(data.accessToken)
    setUser({ ...data.user, company: null })
    if (typeof window !== 'undefined') localStorage.setItem('sa_token', data.accessToken)
  }

  function logout() {
    setUser(null)
    setToken(null)
    if (typeof window !== 'undefined') localStorage.removeItem('sa_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
