'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

/**
 * AdminLayout — gate di autenticazione per tutte le rotte /admin/*.
 * 
 * Se l'utente non è loggato o non è ADMIN/TEAM_ADMIN → redirect a /auth/login.
 * Questo è l'unico posto dove serve il controllo: tutte le pagine sotto /admin/
 * ereditano automaticamente questo layout.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }
    if (user.role !== 'ADMIN' && user.role !== 'TEAM_ADMIN') {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  // Mostra niente durante il check auth
  if (isLoading) return (
    <div style={{ padding: 80, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
      Verifica accesso...
    </div>
  )

  if (!user || (user.role !== 'ADMIN' && user.role !== 'TEAM_ADMIN')) return null

  return <>{children}</>
}
