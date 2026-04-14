export interface SoftwareBrand {
  key: string; name: string; tagline: string;
  color: string; light: string; border: string;
}

// ── Registry unico delle famiglie software ──────────────────────────────────
// Sorgente di verità per nome, tagline e colori di ogni famiglia.
// Chiavi in lowercase per coerenza; il lookup `getBrand()` è case-insensitive,
// quindi funziona anche con slug scritti in camelCase nel DB (es. `serviFormA`).
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

// Fallback neutro quando lo slug non è mappato (evita variazioni tra sezioni)
const FALLBACK_BRAND: SoftwareBrand = {
  key: '', name: '', tagline: '',
  color: '#4E4D4D', light: '#F5F5F5', border: '#E8E8E8',
}

/**
 * Risolve un brand a partire dallo slug del software.
 * Lookup case-insensitive e tollerante agli spazi: qualunque variante di
 * casing (`serviFormA`, `serviforma`, `ServiFormA`) restituisce lo stesso
 * brand, garantendo colori/tagline coerenti in tutte le sezioni del portale.
 */
export function getBrand(slug?: string | null): SoftwareBrand {
  if (!slug) return FALLBACK_BRAND
  const normalized = slug.trim().toLowerCase()
  const match = SOFTWARE_BRANDS[normalized]
  if (match) return match
  return { ...FALLBACK_BRAND, key: slug, name: slug }
}

export const LEVEL_COLORS: Record<string, string> = {
  Base: '#067DB8', Intermedio: '#D97706', Avanzato: '#E63329',
}
