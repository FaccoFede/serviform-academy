import { api, Course } from '@/lib/api'
import Hero from '@/components/ui/Hero'
import CourseGrid from './CourseGrid'

/**
 * Homepage — pagina principale della piattaforma.
 *
 * Server Component: fa il fetch dei corsi lato server.
 * Passa i dati al CourseGrid (Client Component) per il filtraggio interattivo.
 *
 * Struttura:
 * - Hero con statistiche animate
 * - FilterBar con chip per software
 * - CourseGrid con card dei corsi
 */
export default async function HomePage() {
  let courses: Course[] = []

  try {
    courses = await api.courses.findAll()
  } catch {
    // In caso di errore API, mostra la pagina con array vuoto
    // TODO: gestire con error boundary dedicata
  }

  // Calcolo statistiche per la hero
  const courseCount = courses.length
  const unitCount = courses.reduce(
    (sum, c) => sum + (c.units?.length || 0),
    0,
  )

  return (
    <>
      <Hero
        courseCount={courseCount}
        unitCount={unitCount}
        videoCount={0}
      />

      <CourseGrid courses={courses} />
    </>
  )
}
