'use client'

import { useState } from 'react'
import { Course } from '@/lib/api'
import { getBrand } from '@/lib/brands'
import { FilterBar, CourseCard } from '@/components/ui'
import styles from './CourseGrid.module.css'

interface CourseGridProps {
  courses: Course[]
}

export default function CourseGrid({ courses }: CourseGridProps) {
  const [filter, setFilter] = useState<string | null>(null)

  // Filtri dinamici: mostra solo le famiglie che hanno almeno un corso.
  // Usa getBrand(slug, dbSoftware) così name/color riflettono i valori DB.
  const swMap = new Map<string, Course['software']>()
  courses.forEach(c => { if (c.software?.slug) swMap.set(c.software.slug, c.software) })

  const filterOptions = Array.from(swMap.entries()).map(([slug, sw]) => {
    const brand = getBrand(slug, sw)
    return { label: brand.name, value: slug, color: brand.color }
  })

  const filtered = filter
    ? courses.filter((c) => c.software?.slug === filter)
    : courses

  return (
    <>
      <FilterBar options={filterOptions} onChange={setFilter} />
      <div className={styles.grid}>
        {filtered.map((course) => (
          <CourseCard
            key={course.id}
            slug={course.slug}
            title={course.title}
            description={course.description}
            softwareSlug={course.software?.slug || ''}
            software={course.software}
            level={course.level}
            duration={course.duration}
            unitCount={course.units?.length}
            // Area pubblica: tutti i corsi mostrati come VISIBLE_LOCKED
            // L'accesso reale viene risolto nel catalogo autenticato
            state={course.available ? 'ACTIVE' : 'VISIBLE_LOCKED'}
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
