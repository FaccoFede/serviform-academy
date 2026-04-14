export interface SoftwareBrand {
  key: string; name: string; tagline: string;
  color: string; light: string; border: string;
}

/**
 * Sottoinsieme del modello Software restituito dall'API.
 * Usato come override opzionale in `getBrand`.
 */
export interface DbSoftware {
  id?: string
  slug: string
  name?: string | null
  tagline?: string | null
  color?: string | null
  lightColor?: string | null
}

// ── Registry di default ──────────────────────────────────────────────────────
// Usato come fallback quando i valori DB sono null/undefined.
// I valori definitivi vengono dal DB via admin Software.
// Chiavi in lowercase; getBrand() fa lookup case-insensitive.
export const SOFTWARE_BRANDS: Record<string, SoftwareBrand> = {
  engview: {
    key: 'engview', name: 'EngView',
    tagline: 'Progettazione strutturale packaging 2D e 3D',
    color: '#003875', light: '#EEF3FA', border: '#C5D5EB',
  },
  sysform: {
    key: 'sysform', name: 'Sysform',
    tagline: 'Progettazione e creazione di utensili fustella',
    color: '#E63329', light: '#FFF1F0', border: '#F5C4C4',
  },
  projecto: {
    key: 'projecto', name: 'ProjectO',
    tagline: 'La soluzione gestionale innovativa per i fustellifici',
    color: '#067DB8', light: '#E3F4FC', border: '#A8D8EE',
  },
  serviforma: {
    key: 'serviforma', name: 'ServiformA',
    tagline: 'I nostri consigli per potenziare la tua produttività',
    color: '#2D6A4F', light: '#EDFAF3', border: '#A8D5BC',
  },
}

const FALLBACK_BRAND: SoftwareBrand = {
  key: '', name: '', tagline: '',
  color: '#4E4D4D', light: '#F5F5F5', border: '#E8E8E8',
}

/**
 * Risolve un brand a partire dallo slug del software.
 *
 * - Lookup case-insensitive: `serviFormA`, `serviforma`, `ServiformA` → stesso brand.
 * - Se viene passato un oggetto `db` (proveniente dall'API /software), i suoi
 *   valori sovrascrivono quelli di default per name, tagline, color e lightColor.
 *   Questo consente che le modifiche fatte in admin/software vengano rispecchiate
 *   in tutto il portale senza toccare questo file.
 *
 * Chiamata senza `db` → comportamento identico a prima, compatibile ovunque.
 * Chiamata con `db` → i dati live del DB prevalgono sui default statici.
 */
export function getBrand(slug?: string | null, db?: DbSoftware | null): SoftwareBrand {
  const normalized = slug ? slug.trim().toLowerCase() : ''
  const base: SoftwareBrand = normalized && SOFTWARE_BRANDS[normalized]
    ? { ...SOFTWARE_BRANDS[normalized] }
    : { ...FALLBACK_BRAND, key: slug || '', name: slug || '' }

  if (!db) return base

  // Applica i valori DB dove presenti e non vuoti, mantenendo i default come fallback
  if (db.name)      base.name    = db.name
  if (db.tagline)   base.tagline = db.tagline
  if (db.color)     base.color   = db.color
  // DB usa `lightColor`, SoftwareBrand usa `light` — mappa il campo
  if (db.lightColor) base.light  = db.lightColor

  return base
}

export const LEVEL_COLORS: Record<string, string> = {
  Base: '#067DB8', Intermedio: '#D97706', Avanzato: '#E63329',
}
