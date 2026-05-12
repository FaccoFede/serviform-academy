import { Suspense } from 'react'
import CatalogClient from './CatalogClient'
import { api } from '@/lib/api'

export const metadata = { title: 'Catalogo — Serviform Academy' }

export default async function CatalogPage() {
  let courses: any[] = []
  try {
    const all = await api.courses.findAll()
    // Filtra i corsi HIDDEN: non devono comparire nel catalogo pubblico.
    // VISIBLE_LOCKED e PUBLISHED vengono passati al client.
    courses = Array.isArray(all) ? all.filter((c: any) => c.publishState !== 'HIDDEN') : []
  } catch {
    // backend non raggiungibile — mostra catalogo vuoto
  }
  // PROP NAME: "courses" (non "initialCourses") — allineato con CatalogClient
  // Suspense richiesto da useSearchParams in CatalogClient
  return (
    <Suspense>
      <CatalogClient courses={Array.isArray(courses) ? courses : []} />
    </Suspense>
  )
}
