import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { SoftwareTag } from '@/components/ui'
import styles from './CoursePage.module.css'

/**
 * CoursePage — dettaglio di un corso.
 *
 * Server Component: carica il corso per slug con le unità ordinate.
 * Mostra: tag software, titolo, descrizione, lista unità navigabili.
 */
export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let course
  try {
    course = await api.courses.findBySlug(slug)
  } catch {
    notFound()
  }

  if (!course) notFound()

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <Link href="/" className={styles.back}>
          ← Tutti i corsi
        </Link>

        <SoftwareTag slug={course.software?.slug || ''} />
        <h1 className={styles.title}>{course.title}</h1>
        {course.description && (
          <p className={styles.desc}>{course.description}</p>
        )}
      </div>

      <section className={styles.unitsSection}>
        <h2 className={styles.unitsTitle}>Unità del corso</h2>

        <div className={styles.unitList}>
          {course.units?.map((unit) => (
            <Link
              key={unit.id}
              href={`/courses/${slug}/${unit.slug}`}
              className={styles.unitItem}
            >
              <span className={styles.unitOrder}>{unit.order}</span>
              <span className={styles.unitName}>{unit.title}</span>
              <svg
                className={styles.unitArrow}
                viewBox="0 0 14 14"
                fill="none"
                width={14}
                height={14}
              >
                <path
                  d="M5 2l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ))}
        </div>

        {(!course.units || course.units.length === 0) && (
          <p className={styles.empty}>
            Nessuna unità disponibile per questo corso.
          </p>
        )}
      </section>
    </main>
  )
}
