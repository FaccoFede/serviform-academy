'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * useUnsavedChanges
 *
 * Previene la perdita di dati quando:
 * 1. L'utente chiude il tab / ricarica la pagina (beforeunload)
 * 2. L'utente naviga via con Next.js router
 *
 * Uso:
 *   const { markDirty, markClean } = useUnsavedChanges(isDirty)
 *
 * isDirty: boolean — true se ci sono modifiche non salvate
 */
export function useUnsavedChanges(isDirty: boolean) {
  const isDirtyRef = useRef(isDirty)

  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  // 1. Blocca chiusura tab / F5
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return
      e.preventDefault()
      e.returnValue = 'Hai modifiche non salvate. Vuoi uscire?'
      return e.returnValue
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // 2. Intercetta click sui link Next.js
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!isDirtyRef.current) return
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) return
      // Link interno Next.js
      if (!href.startsWith('http')) {
        const confirmed = window.confirm('Hai modifiche non salvate. Vuoi uscire senza salvare?')
        if (!confirmed) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [])

  const markDirty = useCallback(() => { isDirtyRef.current = true }, [])
  const markClean = useCallback(() => { isDirtyRef.current = false }, [])

  return { markDirty, markClean }
}
