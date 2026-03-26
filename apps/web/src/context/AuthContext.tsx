'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name?: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('sa_token')
    if (saved) {
      setToken(saved)
      fetchProfile(saved)
    } else {
      setIsLoading(false)
    }
  }, [])

  async function fetchProfile(t: string) {
    try {
      const res = await fetch(API_URL + '/auth/profile', {
        headers: { Authorization: 'Bearer ' + t },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setToken(t)
      } else {
        localStorage.removeItem('sa_token')
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  async function login(email: string, password: string) {
    const res = await fetch(API_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Errore di login')
    }
    const data = await res.json()
    setToken(data.accessToken)
    setUser(data.user)
    localStorage.setItem('sa_token', data.accessToken)
  }

  async function register(email: string, password: string, name?: string) {
    const res = await fetch(API_URL + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Errore di registrazione')
    }
    const data = await res.json()
    setToken(data.accessToken)
    setUser(data.user)
    localStorage.setItem('sa_token', data.accessToken)
  }

  function logout() {
    setUser(null)
    setToken(null)
    localStorage.removeItem('sa_token')
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
