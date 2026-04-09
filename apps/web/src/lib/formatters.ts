/**
 * @file apps/web/src/lib/formatters.ts
 * @description Funzioni di formattazione centralizzate.
 *
 * ── PROBLEMA RISOLTO ─────────────────────────────────────────────────────
 * La funzione `formatDate` era definita in modo identico in 9+ file:
 *   function formatDate(d: string) {
 *     if (!d) return ''
 *     return new Date(d).toLocaleDateString('it-IT', { ... })
 *   }
 *
 * Fix: unico file importabile da tutti i componenti.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * UTILIZZO:
 *   import { formatDate, formatDateShort, formatDateTime } from '@/lib/formatters'
 */

/**
 * Formatta una data ISO in italiano — formato lungo.
 * @example "2 aprile 2026"
 * @param d - Stringa data ISO o Date (ritorna stringa vuota se falsy)
 */
export function formatDate(d: string | Date | undefined | null): string {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('it-IT', {
      day:   '2-digit',
      month: 'long',
      year:  'numeric',
    })
  } catch {
    return ''
  }
}

/**
 * Formatta una data ISO in italiano — formato breve con mese abbreviato.
 * @example "02 apr 2026"
 * @param d - Stringa data ISO o Date
 */
export function formatDateShort(d: string | Date | undefined | null): string {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('it-IT', {
      day:   '2-digit',
      month: 'short',
      year:  'numeric',
    })
  } catch {
    return ''
  }
}

/**
 * Formatta una data ISO con ora in italiano.
 * @example "02/04/2026, 09:00"
 * @param d - Stringa data ISO o Date
 */
export function formatDateTime(d: string | Date | undefined | null): string {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('it-IT', {
      day:    '2-digit',
      month:  '2-digit',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

/**
 * Formatta una data ISO per il saluto contestuale del giorno (oggi).
 * @example "mercoledì 8 aprile"
 */
export function formatToday(): string {
  return new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  })
}

/**
 * Formatta una data ISO per il mini-calendario (giorno e mese abbreviato).
 * @returns { day: '08', month: 'apr' }
 * @param d - Stringa data ISO o Date
 */
export function formatCalendarDay(d: string | Date | undefined | null): {
  day: string
  month: string
} {
  if (!d) return { day: '—', month: '' }
  const date = new Date(d)
  return {
    day:   date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleDateString('it-IT', { month: 'short' }),
  }
}

/**
 * Determina il saluto in base all'ora corrente.
 * @returns "Buongiorno" | "Buon pomeriggio" | "Buonasera"
 */
export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buongiorno'
  if (h < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}

/**
 * Tronca un testo a `maxLength` caratteri aggiungendo ellipsis.
 * @param text      - Testo da troncare
 * @param maxLength - Lunghezza massima (default: 160)
 */
export function truncate(text: string, maxLength = 160): string {
  if (!text || text.length <= maxLength) return text ?? ''
  return text.slice(0, maxLength) + '…'
}

/**
 * Formatta un numero percentuale per la visualizzazione.
 * @example formatPercent(72.3) → "72%"
 * @param n - Numero 0–100
 */
export function formatPercent(n: number): string {
  return Math.round(n) + '%'
}

/**
 * Genera uno slug URL-safe da una stringa di testo.
 * Usato per suggerire lo slug automaticamente dal titolo.
 * @example "Modulo 3D EngView" → "modulo-3d-engview"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // rimuove accenti
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
