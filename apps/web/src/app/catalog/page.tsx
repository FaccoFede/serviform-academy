import { Suspense } from 'react'
import CatalogClient from './CatalogClient'

export const metadata = { title: 'Catalogo — Serviform Academy' }

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default async function CatalogPage() {
  let courses: any[] = []
  try {
    const res = await fetch(`${API_URL}/courses`, { cache: 'no-store' })
    if (res.ok) {
      const all = await res.json()
      // Filtra i corsi HIDDEN: non devono comparire nel catalogo pubblico.
      // VISIBLE_LOCKED e PUBLISHED vengono passati al client.
      courses = Array.isArray(all) ? all.filter((c: any) => c.publishState !== 'HIDDEN') : []
    }
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
