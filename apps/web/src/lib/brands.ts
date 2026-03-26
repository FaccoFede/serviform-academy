export interface SoftwareBrand {
  key: string; name: string; tagline: string;
  color: string; light: string; border: string;
}

export const SOFTWARE_BRANDS: Record<string, SoftwareBrand> = {
  engview: {
    key: 'engview', name: 'EngView',
    tagline: 'Progettazione strutturale packaging 2D e 3D',
    color: '#003875', light: '#EEF3FA', border: '#C5D5EB',
  },
  sysform: {
    key: 'sysform', name: 'Sysform',
    tagline: 'Gestione e ottimizzazione della produzione',
    color: '#E63329', light: '#FFF1F0', border: '#F5C4C4',
  },
  projecto: {
    key: 'projecto', name: 'ProjectO',
    tagline: 'Project management e workflow creativo',
    color: '#067DB8', light: '#E3F4FC', border: '#A8D8EE',
  },
  serviformA: {
    key: 'serviformA', name: 'ServiformA',
    tagline: 'Gestione amministrativa e documentale Serviform',
    color: '#2D6A4F', light: '#EDFAF3', border: '#A8D5BC',
  },
}

export function getBrand(slug: string): SoftwareBrand {
  return SOFTWARE_BRANDS[slug] || { key: slug, name: slug, tagline: '', color: '#4E4D4D', light: '#F5F5F5', border: '#E8E8E8' }
}

export const LEVEL_COLORS: Record<string, string> = {
  Base: '#067DB8', Intermedio: '#D97706', Avanzato: '#E63329',
}
