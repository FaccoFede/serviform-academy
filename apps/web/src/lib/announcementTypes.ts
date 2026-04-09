/**
 * @file apps/web/src/lib/announcementTypes.ts
 * @description Configurazione centralizzata per i tipi di annuncio.
 *
 * ── PROBLEMA RISOLTO ─────────────────────────────────────────────────────
 * TYPE_LABELS e TYPE_COLORS erano definiti in modo identico (ma potenzialmente
 * divergente) in 5 file:
 *   - apps/web/src/app/newsroom/page.tsx
 *   - apps/web/src/app/communications/page.tsx
 *   - apps/web/src/app/communications-events/page.tsx
 *   - apps/web/src/app/dashboard/page.tsx
 *   - apps/web/src/app/admin/announcements/page.tsx
 * ─────────────────────────────────────────────────────────────────────────
 *
 * UTILIZZO:
 *   import {
 *     TYPE_LABELS, TYPE_COLORS, NEWS_TYPES, EVENT_TYPES,
 *     getAnnouncementMeta, isEventType
 *   } from '@/lib/announcementTypes'
 */

/**
 * Mappa tipo → etichetta italiana leggibile.
 * Corrisponde all'enum AnnouncementType in schema.prisma.
 */
export const TYPE_LABELS: Record<string, string> = {
  NEWS:        'Novità',
  NEW_COURSE:  'Nuovo corso',
  WEBINAR:     'Webinar',
  MAINTENANCE: 'Manutenzione',
  EVENTS:      'Evento',
} as const

/**
 * Mappa tipo → colore brand.
 *
 * Palette:
 *   - Blu    (#067DB8) → NEWS: informativo/neutro
 *   - Rosso  (#E63329) → NEW_COURSE: brand primario Serviform
 *   - Verde  (#059669) → WEBINAR/EVENTS: azione/partecipazione
 *   - Ambra  (#D97706) → MAINTENANCE: avviso/warning
 */
export const TYPE_COLORS: Record<string, string> = {
  NEWS:        '#067DB8',
  NEW_COURSE:  '#E63329',
  WEBINAR:     '#059669',
  MAINTENANCE: '#D97706',
  EVENTS:      '#059669',
} as const

/**
 * Tipi di annuncio classificati come NEWS.
 * Questi tipi vanno nella griglia comunicazioni, NON nel calendario eventi.
 *
 * Modifica questo Set per riclassificare un tipo:
 *   NEWS_TYPES.add('NUOVO_TIPO') → appare nelle news
 */
export const NEWS_TYPES = new Set<string>(['NEWS', 'NEW_COURSE', 'MAINTENANCE'])

/**
 * Tipi di annuncio classificati come EVENTI.
 * Questi tipi vanno nel calendario e nella sezione eventi.
 * NON devono apparire nella griglia news principale.
 */
export const EVENT_TYPES = new Set<string>(['WEBINAR', 'EVENTS'])

/**
 * Restituisce true se il tipo è classificato come evento.
 * Usato per separare news da eventi nella Newsroom.
 */
export function isEventType(type: string): boolean {
  return EVENT_TYPES.has(type)
}

/**
 * Restituisce true se il tipo è classificato come news.
 * Tipi non riconosciuti vengono considerati news (fallback sicuro).
 */
export function isNewsType(type: string): boolean {
  return NEWS_TYPES.has(type) || !EVENT_TYPES.has(type)
}

/**
 * Restituisce metadati completi per un tipo di annuncio.
 * Fallback sicuro per tipi non riconosciuti (es. tipi futuri).
 *
 * @param type - Tipo annuncio (dal backend)
 * @returns { label, color, bg } — bg è il colore al 15% di opacità
 *
 * @example
 *   const { label, color, bg } = getAnnouncementMeta('NEWS')
 *   // → { label: 'Novità', color: '#067DB8', bg: '#067DB826' }
 */
export function getAnnouncementMeta(type: string): {
  label: string
  color: string
  /** Colore di sfondo (colore principale + 26 in hex ≈ 15% opacità) */
  bg: string
} {
  const color = TYPE_COLORS[type] ?? '#888888'
  return {
    label: TYPE_LABELS[type] ?? type,
    color,
    bg:    color + '26',
  }
}
