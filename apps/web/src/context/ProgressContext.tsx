'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface ProgressContextType {
  completedUnits: Set<string>
  markCompleted: (unitId: string) => Promise<void>
  markViewed: (unitId: string) => Promise<void>
  isCompleted: (unitId: string) => boolean
  loadCompletedUnitsFromServer: (courseSlug: string) => Promise<void>
  courseProgress: (unitIds: string[]) => { completed: number; total: number; percent: number }
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [completedUnits, setCompletedUnits] = useState<Set<string>>(new Set())
  const [loadedCourses, setLoadedCourses] = useState<Set<string>>(new Set())

  const loadCompletedUnitsFromServer = useCallback(async (courseSlug: string) => {
    if (!token || loadedCourses.has(courseSlug)) return
    try {
      const res = await fetch(`${API_URL}/progress/course/${courseSlug}/completed-units`, { headers: { Authorization: 'Bearer ' + token } })
      if (!res.ok) return
      const ids: string[] = await res.json()
      if (ids.length) setCompletedUnits(prev => new Set([...prev, ...ids]))
      setLoadedCourses(prev => new Set([...prev, courseSlug]))
    } catch {}
  }, [token, loadedCourses])

  const markCompleted = useCallback(async (unitId: string) => {
    if (!token) return
    setCompletedUnits(prev => new Set([...prev, unitId]))
    try {
      await fetch(`${API_URL}/progress/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ unitId }),
      })
    } catch {}
  }, [token])

  const markViewed = useCallback(async (unitId: string) => {
    if (!token) return
    try {
      await fetch(`${API_URL}/progress/viewed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ unitId }),
      })
    } catch {}
  }, [token])

  const isCompleted = useCallback((unitId: string) => completedUnits.has(unitId), [completedUnits])
  const courseProgress = useCallback((unitIds: string[]) => {
    const completed = unitIds.filter(id => completedUnits.has(id)).length
    const total = unitIds.length
    return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) }
  }, [completedUnits])

  return (
    <ProgressContext.Provider value={{ completedUnits, markCompleted, markViewed, isCompleted, loadCompletedUnitsFromServer, courseProgress }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
