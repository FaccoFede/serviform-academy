'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface ProgressContextType {
  completedUnits: Set<string>
  markCompleted: (unitId: string) => Promise<void>
  isCompleted: (unitId: string) => boolean
  courseProgress: (unitIds: string[]) => { completed: number; total: number; percent: number }
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const [completedUnits, setCompletedUnits] = useState<Set<string>>(new Set())

  const markCompleted = useCallback(async (unitId: string) => {
    if (!user || !token) return
    try {
      await fetch(API_URL + '/progress/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ userId: user.id, unitId }),
      })
      setCompletedUnits(prev => new Set([...prev, unitId]))
    } catch {
      // Fallback: segna comunque come completata localmente
      setCompletedUnits(prev => new Set([...prev, unitId]))
    }
  }, [user, token])

  const isCompleted = useCallback((unitId: string) => {
    return completedUnits.has(unitId)
  }, [completedUnits])

  const courseProgress = useCallback((unitIds: string[]) => {
    const completed = unitIds.filter(id => completedUnits.has(id)).length
    const total = unitIds.length
    return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) }
  }, [completedUnits])

  return (
    <ProgressContext.Provider value={{ completedUnits, markCompleted, isCompleted, courseProgress }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
