import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { getBrand, LEVEL_COLORS } from '@/lib/brands'
import styles from './CoursePage.module.css'

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let course: any
  try { course = await api.courses.findBySlug(slug) } catch { notFound() }
  if (!course) notFound()

  const brand = getBrand(course.software?.slug || '')
  const levelColor = LEVEL_COLORS[course.level] || '#6B6B6B'
  const overviewUnit = course.units?.find((u: any) => u.unitType === 'OVERVIEW')
  const lessonUnits = course.units?.filter((u: any) => u.unitType !== 'OVERVIEW') || []

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.back}>
        <svg viewBox="0 0 14 14" fill="none" width={14} height={14}><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Tutti i moduli
      </Link>

      <div className={styles.hero} style={{ '--brand-color': brand.color, '--brand-light': brand.light } as React.CSSProperties}>
        <span className={styles.swTag} style={{ background: brand.light, color: brand.color }}>{brand.name}</span>
        <h1>{course.title}</h1>
        {course.description && <p className={styles.desc}>{course.description}</p>}

        <div className={styles.meta}>
          {course.duration && <span className={styles.metaItem}>
            <svg viewBox="0 0 16 16" fill="none" width={14} height={14}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            {course.duration}
          </span>}
          <span className={styles.metaItem}>
            <svg viewBox="0 0 16 16" fill="none" width={14} height={14}><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M2 6h12" stroke="currentColor" strokeWidth="1.2"/></svg>
            {lessonUnits.length} unità
          </span>
          {course.level && <span className={styles.metaItem} style={{ color: levelColor }}>● {course.level}</span>}
        </div>
      </div>

      {overviewUnit?.content && (
        <section className={styles.overview}>
          <div className={styles.overviewContent} dangerouslySetInnerHTML={{ __html: overviewUnit.content }} />
        </section>
      )}

      <section className={styles.unitsSection}>
        <h2>Percorso del modulo</h2>
        <p className={styles.unitsIntro}>Il modulo può essere svolto in autonomia con le guide Zendesk oppure con un formatore dedicato.</p>

        <div className={styles.unitList}>
          {lessonUnits.map((unit: any, i: number) => (
            <div key={unit.id} className={styles.unitItem}>
              <span className={styles.unitNum}>{i + 1}</span>
              <div className={styles.unitInfo}>
                <h4>{unit.title}</h4>
                {unit.subtitle && <p>{unit.subtitle}</p>}
              </div>
              {unit.duration && <span className={styles.unitDuration}>{unit.duration}</span>}
            </div>
          ))}
        </div>
      </section>

      <div className={styles.actions}>
        {lessonUnits[0] && (
          <Link href={"/courses/" + slug + "/" + lessonUnits[0].slug} className={styles.startBtn}>
            <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><path d="M5 3l8 5-8 5V3z" fill="currentColor"/></svg>
            Inizia il modulo
          </Link>
        )}
        <a href="mailto:support@serviform.com?subject=Richiesta formatore per: " className={styles.trainerBtn}>
          <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.2"/></svg>
          Richiedi un formatore
        </a>
        <a href="https://support.serviform.com" target="_blank" rel="noopener" className={styles.guideBtn}>
          <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 6.5a2 2 0 114 0c0 1-1 1.5-2 2M8 11.5v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          Guide su Zendesk
        </a>
      </div>
    </main>
  )
}
