'use client'

import { useState } from 'react'
import { Course } from '@/lib/api'
import { SOFTWARE_BRANDS } from '@/lib/brands'
import { FilterBar, CourseCard } from '@/components/ui'
import styles from './CourseGrid.module.css'

/**
 * CourseGrid — griglia interattiva dei corsi con filtro software.
 *
 * Client Component perché gestisce lo stato del filtro.
 * Riceve i corsi dal Server Component parent (HomePage).
 */
interface CourseGridProps {
  courses: Course[]
}

/** Opzioni di filtro derivate dai brand software */
const FILTER_OPTIONS = Object.values(SOFTWARE_BRANDS).map((brand) => ({
  label: brand.name,
  value: brand.key,
  color: brand.color,
}))

export default function CourseGrid({ courses }: CourseGridProps) {
  const [filter, setFilter] = useState<string | null>(null)

  // Filtra i corsi in base al software selezionato
  const filtered = filter
    ? courses.filter((c) => c.software?.slug === filter)
    : courses

  return (
    <>
      <FilterBar options={FILTER_OPTIONS} onChange={setFilter} />

      <div className={styles.grid}>
        {filtered.map((course) => (
          <CourseCard
            key={course.id}
            slug={course.slug}
            title={course.title}
            description={course.description}
            softwareSlug={course.software?.slug || ''}
            unitCount={course.units?.length}
          />
        ))}

        {filtered.length === 0 && (
          <div className={styles.empty}>
            <p>Nessun corso trovato per questo filtro.</p>
          </div>
        )}
      </div>
    </>
  )
}
