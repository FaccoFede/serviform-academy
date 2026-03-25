import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { getBrand, LEVEL_COLORS } from '@/lib/brands'
import CoursePageClient from './CoursePageClient'

/**
 * Pagina corso — Server Component per fetch dati.
 * Delega la parte interattiva (progress, accesso) al Client Component.
 */
export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let course: any
  try { course = await api.courses.findBySlug(slug) } catch { notFound() }
  if (!course) notFound()

  return <CoursePageClient course={course} />
}
