/**
 * Configurazione famiglie software Serviform.
 *
 * Colori estratti dai loghi SVG ufficiali:
 * - EngView: #003875 (da logoEngView.svg)
 * - Sysform: #E63329 (rosso Serviform, confermato dal logo idmcad21)
 * - ProjectO: #067DB8 (da ProjectO-icona-positivo.svg)
 * - ServiformA: #F6CD4D (oro dal brand kit — accento premium)
 *
 * Fonte: 04_domain_model.md — SoftwareFamily valori iniziali
 * Fonte: DOCX sez. INTRODUZIONE SOFTWARE SERVIFORMA
 */

export interface SoftwareBrand {
  slug: string
  name: string
  tagline: string
  color: string
  lightBg: string
}

export const SOFTWARE_BRANDS: Record<string, SoftwareBrand> = {
  engview: {
    slug: 'engview',
    name: 'EngView',
    tagline: 'Progettazione strutturale packaging 2D e 3D',
    color: '#003875',
    lightBg: '#EEF3FA',
  },
  sysform: {
    slug: 'sysform',
    name: 'Sysform',
    tagline: 'Gestione e ottimizzazione della produzione',
    color: '#E63329',
    lightBg: '#FFF1F0',
  },
  projecto: {
    slug: 'projecto',
    name: 'ProjectO',
    tagline: 'Project management e workflow creativo',
    color: '#067DB8',
    lightBg: '#E3F4FC',
  },
  serviforma: {
    slug: 'serviforma',
    name: 'ServiformA',
    tagline: 'Ecosistema software Serviform',
    color: '#F6CD4D',
    lightBg: '#FFFBEB',
  },
}

export function getBrand(slug: string): SoftwareBrand | undefined {
  return SOFTWARE_BRANDS[slug.toLowerCase()]
}

export const ALL_FAMILIES = Object.values(SOFTWARE_BRANDS)
