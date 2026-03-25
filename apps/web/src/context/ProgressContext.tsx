'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { useAuth } from './AuthContext'

interface ProgressContextType {
  completedUnits: Set<string>
  markCompleted: (unitId: string) => Promise<void>
  markViewed: (unitId: string) => Promise<void>
  isCompleted: (unitId: string) => boolean
  /**
   * Carica dal server le unità già completate per un corso.
   * Va chiamato all'ingresso della pagina corso o unità.
   * Aggiunge (union) — non sovrascrive le unità già nel Set.
   */
  loadCompletedUnitsFromServer: (courseSlug: string) => Promise<void>
  courseProgress: (unitIds: string[]) => { completed: number; total: number; percent: number }
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [completedUnits, setCompletedUnits] = useState<Set<string>>(new Set())
  // Traccia quali slug corso sono già stati caricati per evitare fetch ripetuti
  const [loadedCourses, setLoadedCourses] = useState<Set<string>>(new Set())

  /**
   * Carica dal server gli unitId completati per un corso e li aggiunge al Set.
   * Idempotente: se il corso è già stato caricato in questa sessione, non rifà il fetch.
   */
  const loadCompletedUnitsFromServer = useCallback(
    async (courseSlug: string) => {
      if (!token) return
      // Evita fetch doppi nella stessa sessione
      if (loadedCourses.has(courseSlug)) return

      try {
        const res = await fetch(
          `${API_URL}/progress/course/${courseSlug}/completed-units`,
          { headers: { Authorization: 'Bearer ' + token } },
        )
        if (!res.ok) return

        const unitIds: string[] = await res.json()
        if (unitIds.length > 0) {
          setCompletedUnits(prev => new Set([...prev, ...unitIds]))
        }
        setLoadedCourses(prev => new Set([...prev, courseSlug]))
      } catch {
        // silent fail — il progresso visivo è best-effort
      }
    },
    [token, loadedCourses],
  )

  /**
   * Segna un'unità come completata.
   * Aggiornamento ottimistico: aggiorna il Set prima della risposta del server.
   * CRITICO: nessun userId nel body — il backend lo deduce dal JWT.
   */
  const markCompleted = useCallback(
    async (unitId: string) => {
      if (!token) return
      // Ottimistico — aggiorna subito il Set locale
      setCompletedUnits(prev => new Set([...prev, unitId]))
      try {
        await fetch(`${API_URL}/progress/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
          body: JSON.stringify({ unitId }),
        })
      } catch {
        // L'aggiornamento ottimistico resta valido
      }
    },
    [token],
  )

  /**
   * Aggiorna il timestamp di ultima visualizzazione.
   * Usato per "continua da dove eri" — silent fail accettabile.
   */
  const markViewed = useCallback(
    async (unitId: string) => {
      if (!token) return
      try {
        await fetch(`${API_URL}/progress/viewed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
          body: JSON.stringify({ unitId }),
        })
      } catch {
        // silent
      }
    },
    [token],
  )

  const isCompleted = useCallback(
    (unitId: string) => completedUnits.has(unitId),
    [completedUnits],
  )

  const courseProgress = useCallback(
    (unitIds: string[]) => {
      const completed = unitIds.filter(id => completedUnits.has(id)).length
      const total = unitIds.length
      return {
        completed,
        total,
        percent: total === 0 ? 0 : Math.round((completed / total) * 100),
      }
    },
    [completedUnits],
  )

  return (
    <ProgressContext.Provider
      value={{
        completedUnits,
        markCompleted,
        markViewed,
        isCompleted,
        loadCompletedUnitsFromServer,
        courseProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
