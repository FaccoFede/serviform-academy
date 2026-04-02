'use client'

/**
 * CourseAccessBadge
 *
 * Risolve e mostra lo stato effettivo di un corso per l'utente corrente.
 *
 * Logica di risoluzione (in ordine di priorità):
 * 1. publishState === 'HIDDEN'         → corso invisibile (non mostrare mai)
 * 2. publishState === 'VISIBLE_LOCKED' → mostra ma bloccato, nessun progresso
 * 3. expiresAt && expired             → scaduto (bloccato + badge scadenza)
 * 4. !assigned                        → non assegnato (bloccato, no "miei corsi")
 * 5. publishState === 'PUBLISHED' && assigned → attivo
 *
 * REGOLA CRITICA:
 * - Le unità con unitType === 'OVERVIEW' NON contano nel progresso
 * - I corsi non assegnati NON devono apparire in "I miei corsi"
 * - Le progress bar contano SOLO unità LESSON e EXERCISE completate
 */

export type CourseAccessState =
  | 'hidden'
  | 'locked'
  | 'expired'
  | 'unassigned'
  | 'active'
  | 'completed'

export interface CourseAccessInfo {
  state: CourseAccessState
  label: string
  color: string
  bg: string
  canAccess: boolean
  showInMyCourses: boolean
  expiryLabel?: string
}

export function resolveCourseAccess(params: {
  publishState: string
  isAssigned: boolean
  expiresAt?: string | null
  progressPercent?: number
}): CourseAccessInfo {
  const { publishState, isAssigned, expiresAt, progressPercent = 0 } = params

  if (publishState === 'HIDDEN') {
    return { state: 'hidden', label: 'Nascosto', color: '#888', bg: '#f5f5f5', canAccess: false, showInMyCourses: false }
  }

  if (publishState === 'VISIBLE_LOCKED') {
    return { state: 'locked', label: 'Bloccato', color: '#E63329', bg: '#FFF1F0', canAccess: false, showInMyCourses: false }
  }

  // Verifica scadenza
  if (expiresAt) {
    const expDate = new Date(expiresAt)
    if (expDate < new Date()) {
      const expiryLabel = `Scaduto il ${expDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}`
      return { state: 'expired', label: 'Scaduto', color: '#D97706', bg: '#FAEEDA', canAccess: false, showInMyCourses: false, expiryLabel }
    }
  }

  // Non assegnato: visibile nel catalogo ma non nei "miei corsi"
  if (!isAssigned) {
    return { state: 'unassigned', label: 'Non assegnato', color: '#888', bg: '#F1EFE8', canAccess: false, showInMyCourses: false }
  }

  // Completato
  if (progressPercent === 100) {
    return { state: 'completed', label: 'Completato', color: '#059669', bg: '#EDFAF3', canAccess: true, showInMyCourses: true }
  }

  // Attivo
  const expiryLabel = expiresAt
    ? `Scade il ${new Date(expiresAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}`
    : undefined

  return { state: 'active', label: progressPercent > 0 ? 'In corso' : 'Disponibile', color: '#2D6A4F', bg: '#EDFAF3', canAccess: true, showInMyCourses: true, expiryLabel }
}

/**
 * Calcola la percentuale di progresso escludendo le unità OVERVIEW (preview).
 * Solo LESSON e EXERCISE contano nel completamento reale.
 */
export function calculateRealProgress(units: Array<{ id: string; unitType: string }>, completedIds: Set<string>): {
  percent: number
  completed: number
  total: number
} {
  const countable = units.filter(u => u.unitType !== 'OVERVIEW')
  const total = countable.length
  if (total === 0) return { percent: 0, completed: 0, total: 0 }
  const completed = countable.filter(u => completedIds.has(u.id)).length
  return { percent: Math.round((completed / total) * 100), completed, total }
}

interface BadgeProps {
  state: CourseAccessState
  label: string
  color: string
  bg: string
  expiryLabel?: string
}

export function CourseAccessBadge({ state, label, color, bg, expiryLabel }: BadgeProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
        background: bg, color, fontFamily: 'var(--font-mono)', letterSpacing: '.3px',
      }}>
        {label}
      </span>
      {expiryLabel && (
        <span style={{ fontSize: 10, color: '#D97706', fontFamily: 'var(--font-mono)' }}>
          {expiryLabel}
        </span>
      )}
    </span>
  )
}
