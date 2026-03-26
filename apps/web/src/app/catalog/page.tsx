import { api } from '@/lib/api'
import CatalogClient from './CatalogClient'

export const metadata = { title: 'Catalogo — Serviform Academy' }

export default async function CatalogPage() {
  let courses: any[] = []
  try { courses = await api.courses.findAll() } catch {}
  return <CatalogClient courses={courses} />
}
