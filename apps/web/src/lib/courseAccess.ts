/**
 * lib/courseAccess.ts — logica condivisa di accesso/progresso dei corsi.
 *
 * Fonte unica per due cose che prima erano duplicate inline in più pagine:
 *  1. `resolveCourseAccess()` — stato effettivo di un corso per l'utente
 *     (nascosto / bloccato / scaduto / non assegnato / attivo / completato).
 *  2. `countableUnits()` / `calculateRealProgress()` — le unità che contano
 *     nel progresso (LESSON, EXERCISE) escludendo le unità OVERVIEW.
 *
 * REGOLE INVARIANTI:
 *  - Le unità con `unitType === 'OVERVIEW'` NON contano nel progresso.
 *  - I corsi non assegnati NON devono comparire in "I miei corsi".
 *  - `publishState === 'HIDDEN'` → il corso non va mai mostrato.
 *
 * NB: solo funzioni pure, niente JSX (il file è `.ts`). Eventuali badge UI
 * vanno in un componente `.tsx` dedicato.
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
 * Unità "contabili": tutte tranne le OVERVIEW (anteprime).
 * Usare questo helper ovunque servano "le lezioni reali" di un corso,
 * invece di ripetere `.filter(u => u.unitType !== 'OVERVIEW')`.
 */
export function countableUnits<T extends { unitType?: string | null }>(units?: T[] | null): T[] {
  if (!Array.isArray(units)) return []
  return units.filter(u => u?.unitType !== 'OVERVIEW')
}

/**
 * Percentuale di progresso reale: solo le unità contabili (LESSON/EXERCISE),
 * escluse le OVERVIEW.
 */
export function calculateRealProgress(
  units: Array<{ id: string; unitType?: string | null }>,
  completedIds: Set<string>,
): { percent: number; completed: number; total: number } {
  const countable = countableUnits(units)
  const total = countable.length
  if (total === 0) return { percent: 0, completed: 0, total: 0 }
  const completed = countable.filter(u => completedIds.has(u.id)).length
  return { percent: Math.round((completed / total) * 100), completed, total }
}
