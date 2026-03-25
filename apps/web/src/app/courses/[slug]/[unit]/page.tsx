import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import UnitPageClient from './UnitPageClient'

export default async function UnitPage({
  params,
}: {
  params: Promise<{ slug: string; unit: string }>
}) {
  const { slug, unit: unitSlug } = await params
  let data: any
  try { data = await api.units.findBySlug(slug, unitSlug) } catch { notFound() }
  if (!data) notFound()

  return <UnitPageClient data={data} slug={slug} unitSlug={unitSlug} />
}
