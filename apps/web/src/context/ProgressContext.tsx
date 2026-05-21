'use client'
import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { api } from '@/lib/api'

interface ProgressContextType {
  completedUnits: Set<string>
  markCompleted: (unitId: string) => Promise<void>
  markViewed: (unitId: string) => Promise<void>
  isCompleted: (unitId: string) => boolean
  loadCompletedUnitsFromServer: (courseSlug: string) => Promise<void>
  courseProgress: (unitIds: string[]) => { completed: number; total: number; percent: number }
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [completedUnits, setCompletedUnits] = useState<Set<string>>(new Set())
  // useRef invece di useState: non serve ri-renderizzare quando si aggiunge un corso alla cache.
  // Evita anche che loadCompletedUnitsFromServer venga ricreata ad ogni corso caricato,
  // il che con reactCompiler:true scatenava re-esecuzioni a cascata negli useEffect dipendenti.
  const loadedCoursesRef = useRef<Set<string>>(new Set())

  const loadCompletedUnitsFromServer = useCallback(async (courseSlug: string) => {
    if (!token || loadedCoursesRef.current.has(courseSlug)) return
    loadedCoursesRef.current.add(courseSlug)
    try {
      const ids = await api.progress.getCompletedUnits(courseSlug)
      if (ids.length) setCompletedUnits(prev => new Set([...prev, ...ids]))
    } catch {
      // Errore di rete / token scaduto: rimuove dalla cache per permettere il retry.
      loadedCoursesRef.current.delete(courseSlug)
    }
  }, [token])

  const markCompleted = useCallback(async (unitId: string) => {
    if (!token) return
    setCompletedUnits(prev => new Set([...prev, unitId]))
    try {
      await api.progress.complete(unitId)
    } catch {
      // best-effort: lo stato locale resta "completato", il server riallinea al prossimo load
    }
  }, [token])

  const markViewed = useCallback(async (unitId: string) => {
    if (!token) return
    try {
      await api.progress.viewed(unitId)
    } catch {
      // best-effort, nessuna azione necessaria in caso di errore
    }
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
