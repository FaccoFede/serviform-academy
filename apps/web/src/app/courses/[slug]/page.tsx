import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import CoursePageClient from './CoursePageClient'

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let course: any
  try { course = await api.courses.findBySlug(slug) } catch { notFound() }
  if (!course) notFound()
  return <CoursePageClient course={course} />
}
