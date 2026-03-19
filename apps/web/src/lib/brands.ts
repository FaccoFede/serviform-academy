/**
 * Configurazione dei brand software Serviform.
 *
 * Usato per colorare dinamicamente card, badge, tag
 * in base al software associato (EngView, Sysform, ProjectO).
 */

export interface SoftwareBrand {
  key: string
  name: string
  tagline: string
  color: string
  light: string
  border: string
}

export const SOFTWARE_BRANDS: Record<string, SoftwareBrand> = {
  engview: {
    key: 'engview',
    name: 'EngView',
    tagline: 'Progettazione strutturale packaging 2D e 3D',
    color: '#003875',
    light: '#EEF3FA',
    border: '#C5D5EB',
  },
  sysform: {
    key: 'sysform',
    name: 'Sysform',
    tagline: 'Gestione e ottimizzazione della produzione',
    color: '#2D6A4F',
    light: '#E8F5EE',
    border: '#B7DFCA',
  },
  projecto: {
    key: 'projecto',
    name: 'ProjectO',
    tagline: 'Project management e workflow creativo',
    color: '#067DB8',
    light: '#E3F4FC',
    border: '#A8D8EE',
  },
}

/**
 * Restituisce il brand dato uno slug software.
 * Fallback su un brand neutro se non trovato.
 */
export function getBrand(slug: string): SoftwareBrand {
  return (
    SOFTWARE_BRANDS[slug] || {
      key: slug,
      name: slug,
      tagline: '',
      color: '#6B6B6B',
      light: '#F5F5F5',
      border: '#E4E4E4',
    }
  )
}

/**
 * Colori per i livelli dei corsi.
 */
export const LEVEL_COLORS: Record<string, string> = {
  Base: '#2D6A4F',
  Intermedio: '#E8900A',
  Avanzato: '#C8102E',
}
