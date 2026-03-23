import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { getBrand } from '@/lib/brands'
import { SoftwareTag, ProgressBar } from '@/components/ui'
import ExerciseCard from '@/components/features/ExerciseCard'
import styles from './UnitPage.module.css'

export default async function UnitPage({ params }: { params: Promise<{ slug: string; unit: string }> }) {
  const { slug, unit: unitSlug } = await params
  let data: any
  try { data = await api.units.findBySlug(slug, unitSlug) } catch { notFound() }
  if (!data) notFound()

  const units = data.course?.units?.filter((u: any) => u.unitType !== 'OVERVIEW') || []
  const currentIndex = units.findIndex((u: any) => u.slug === unitSlug)
  const prevUnit = currentIndex > 0 ? units[currentIndex - 1] : null
  const nextUnit = currentIndex < units.length - 1 ? units[currentIndex + 1] : null
  const isLast = currentIndex === units.length - 1
  const brand = getBrand(data.course?.software?.slug || '')

  return (
    <main className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href={"/courses/" + slug} className={styles.sidebarBack}>
            <svg viewBox="0 0 14 14" fill="none" width={14} height={14}><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {data.course?.title}
          </Link>
          <SoftwareTag slug={data.course?.software?.slug || ''} size="sm" />
        </div>
        <div className={styles.sidebarProgress}>
          <ProgressBar percent={units.length > 0 ? Math.round(((currentIndex + 1) / units.length) * 100) : 0} />
        </div>
        <nav className={styles.sidebarUnits}>
          {units.map((u: any, i: number) => (
            <Link key={u.id} href={"/courses/" + slug + "/" + u.slug}
              className={u.slug === unitSlug ? styles.unitItemActive : styles.unitItem}>
              <span className={styles.unitIcon}>{i + 1}</span>
              <div className={styles.unitText}>
                <span className={styles.unitItemTitle}>{u.title}</span>
                {u.duration && <span className={styles.unitItemDur}>{u.duration}</span>}
              </div>
            </Link>
          ))}
        </nav>
      </aside>

      <section className={styles.content}>
        <div className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <span>{data.course?.title}</span>
            <span className={styles.sep}>/</span>
            <span className={styles.current}>{data.title}</span>
          </div>
          <span className={styles.progLabel}>{currentIndex + 1} / {units.length}</span>
        </div>

        <div className={styles.body}>
          <div className={styles.unitHeader}>
            <div className={styles.unitMeta}>
              <span className={styles.unitBadge}>Unità {data.order}</span>
              {data.duration && <span className={styles.unitBadge}>{data.duration}</span>}
            </div>
            <h1 className={styles.unitTitle}>{data.title}</h1>
            {data.subtitle && <p className={styles.unitSubtitle}>{data.subtitle}</p>}
          </div>

          {data.content && (
            <div className={styles.richContent} dangerouslySetInnerHTML={{ __html: data.content }} />
          )}

          {data.guide && (
            <div className={styles.guideSection}>
              <span className={styles.guideLabel}>
                <svg viewBox="0 0 16 16" fill="none" width={14} height={14}><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 6.5a2 2 0 114 0c0 1-1 1.5-2 2M8 11.5v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                Guida di riferimento
              </span>
              <a href={data.guide.url} target="_blank" rel="noopener" className={styles.guideLink}>
                <svg viewBox="0 0 14 14" fill="none" width={14} height={14}><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {data.guide.title} — Zendesk
              </a>
            </div>
          )}

          {data.exercises && data.exercises.length > 0 && (
            <div className={styles.exercisesSection}>
              <h3 className={styles.exercisesTitle}>
                <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Esercitazioni
              </h3>
              {data.exercises.map((ex: any) => (
                <ExerciseCard key={ex.id} title={ex.title} description={ex.description} htmlUrl={ex.htmlUrl} evdUrl={ex.evdUrl} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.footerNav}>
          {prevUnit ? (
            <Link href={"/courses/" + slug + "/" + prevUnit.slug} className={styles.navPrev}>
              <svg viewBox="0 0 14 14" fill="none" width={14} height={14}><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Precedente
            </Link>
          ) : <span />}
          <span className={styles.navCenter}>{currentIndex + 1} di {units.length}</span>
          {nextUnit ? (
            <Link href={"/courses/" + slug + "/" + nextUnit.slug} className={styles.navNext}>
              Continua <svg viewBox="0 0 14 14" fill="none" width={14} height={14}><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          ) : (
            <Link href={"/courses/" + slug} className={styles.navComplete}>✓ Completa modulo</Link>
          )}
        </div>
      </section>
    </main>
  )
}
