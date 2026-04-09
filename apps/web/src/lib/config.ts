/**
 * @file apps/web/src/lib/config.ts
 * @description Costanti di configurazione centralizzate per il frontend.
 *
 * ── PROBLEMA RISOLTO ─────────────────────────────────────────────────────
 * La costante API_URL era definita in modo identico in 14+ file:
 *   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
 *
 * Questo causava:
 *   - Duplicazione e rischio di inconsistenza tra file
 *   - Nessun tipo-safety sui percorsi
 *   - Documentazione dispersa
 *
 * Fix: un unico file come source of truth.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * UTILIZZO:
 *   import { API_URL, PREVIEW_UNIT_COUNT, IMAGE_SPECS } from '@/lib/config'
 *
 * CONFIGURAZIONE PRODUZIONE:
 *   Impostare nel file .env.local (non committare in git):
 *     NEXT_PUBLIC_API_URL=https://api.tuodominio.com
 *
 *   O nelle variabili d'ambiente del provider di deploy (Vercel, Docker, etc.)
 *
 * ATTENZIONE:
 *   Le variabili NEXT_PUBLIC_* sono ESPOSTE al browser — non inserire
 *   mai chiavi segrete, password o token privati in questo file.
 */

/**
 * URL base del backend NestJS.
 * - Sviluppo: http://localhost:3001
 * - Produzione: definito via env NEXT_PUBLIC_API_URL
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/**
 * Numero di unità visibili in anteprima senza login.
 * Corrisponde a PREVIEW_UNIT_COUNT / PREVIEW_UNITS nei componenti.
 * Cambiare questo valore aggiorna il comportamento in tutta l'app.
 */
export const PREVIEW_UNIT_COUNT = 2

/**
 * Numero massimo di comunicazioni mostrate nel widget dashboard.
 * Oltre questo limite vengono troncate con "Tutte →".
 */
export const DASHBOARD_MAX_ANNOUNCEMENTS = 5

/**
 * Soglia percentuale per considerare un corso "completato".
 * Normalmente 100, ma può essere abbassata a 80 se si vuole
 * tollerare unità opzionali non completate.
 */
export const COURSE_COMPLETION_THRESHOLD = 100

/**
 * Specifiche dimensioni immagini per la piattaforma.
 * Usare questi valori come riferimento nella documentazione admin
 * e nei messaggi di validazione degli upload.
 *
 * Tutte le dimensioni sono in pixel.
 */
export const IMAGE_SPECS = {
  /**
   * Banner corso nel catalogo.
   * Mostrato come thumbnail 120px altezza con object-fit: cover.
   */
  courseBanner: {
    width:       800,
    height:      200,
    ratio:       '4:1',
    maxKb:       200,
    displayNote: 'Mostra a 100% larghezza card, altezza 120px',
  },

  /**
   * Banner comunicazione/annuncio nella newsroom.
   * Formato standard Open Graph — ottimo anche per anteprima social.
   */
  announcementBanner: {
    width:       1200,
    height:      630,
    ratio:       '1.91:1',
    maxKb:       300,
    displayNote: 'Mostra a 100% larghezza card, altezza 180px',
  },

  /**
   * Avatar utente nel profilo.
   */
  userAvatar: {
    width:       200,
    height:      200,
    ratio:       '1:1',
    maxKb:       100,
    displayNote: 'Mostra circolare 40px in topbar, 80px nel profilo',
  },
} as const

/**
 * Ruoli utente disponibili nella piattaforma.
 * Devono corrispondere all'enum Role in schema.prisma.
 */
export const USER_ROLES = {
  USER:       'USER',
  ADMIN:      'ADMIN',
  TEAM_ADMIN: 'TEAM_ADMIN',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

/**
 * Stati di pubblicazione per i corsi.
 * Devono corrispondere all'enum PublishState in schema.prisma.
 */
export const PUBLISH_STATES = {
  HIDDEN:         'HIDDEN',
  VISIBLE_LOCKED: 'VISIBLE_LOCKED',
  PUBLISHED:      'PUBLISHED',
} as const

export type PublishState = typeof PUBLISH_STATES[keyof typeof PUBLISH_STATES]
