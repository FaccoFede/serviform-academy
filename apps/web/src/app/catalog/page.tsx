import { api } from '@/lib/api'
import CatalogClient from './CatalogClient'

/**
 * Catalogo corsi — sezione separata dalla home pubblica.
 * Non è la home. È il marketplace di esplorazione.
 *
 * Server Component: fetch corsi lato server.
 * Delega filtri e interattività al Client Component.
 */
export const metadata = {
  title: 'Catalogo corsi — Serviform Academy',
  description: 'Esplora tutti i corsi disponibili per EngView, Sysform, ProjectO e ServiformA.',
}

export default async function CatalogPage() {
  let courses: any[] = []
  try {
    courses = await api.courses.findAll()
  } catch {
    // graceful degradation
  }

  return <CatalogClient courses={courses} />
}
