import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { SoftwareTag, ProgressBar } from '@/components/ui'
import styles from './UnitPage.module.css'

/**
 * UnitPage — dettaglio di un'unità didattica.
 *
 * Server Component: carica l'unità con la guida e le unit del corso.
 *
 * Layout a due colonne:
 * - Sidebar sinistra: lista unità del corso con navigazione
 * - Area principale: contenuto dell'unità, guida Zendesk, navigazione prev/next
 */
export default async function UnitPage({
  params,
}: {
  params: Promise<{ slug: string; unit: string }>
}) {
  const { slug, unit: unitSlug } = await params

  let data
  try {
    data = await api.units.findBySlug(slug, unitSlug)
  } catch {
    notFound()
  }

  if (!data) notFound()

  const units = data.course?.units || []
  const currentIndex = units.findIndex((u) => u.slug === unitSlug)
  const prevUnit = currentIndex > 0 ? units[currentIndex - 1] : null
  const nextUnit =
    currentIndex < units.length - 1 ? units[currentIndex + 1] : null

  return (
    <main className={styles.layout}>
      {/* ─── Sidebar ─────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href={`/courses/${slug}`} className={styles.sidebarBack}>
            <svg viewBox="0 0 14 14" fill="none" width={14} height={14}>
              <path
                d="M9 2L4 7l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Tutti i corsi
          </Link>

          {data.course?.software && (
            <SoftwareTag slug={data.course.software.slug} size="sm" />
          )}
          <h3 className={styles.sidebarTitle}>{data.course?.title}</h3>
        </div>

        <div className={styles.sidebarProgress}>
          <ProgressBar
            percent={
              units.length > 0
                ? Math.round(((currentIndex + 1) / units.length) * 100)
                : 0
            }
          />
        </div>

        <nav className={styles.sidebarUnits}>
          {units.map((u) => (
            <Link
              key={u.id}
              href={`/courses/${slug}/${u.slug}`}
              className={`${styles.unitItem} ${
                u.slug === unitSlug ? styles.unitItemActive : ''
              }`}
            >
              <span className={styles.unitIcon}>{u.order}</span>
              <div className={styles.unitText}>
                <span className={styles.unitItemTitle}>{u.title}</span>
              </div>
            </Link>
          ))}
        </nav>
      </aside>

      {/* ─── Content ─────────────────────────────── */}
      <section className={styles.content}>
        {/* Top bar */}
        <div className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <span>{data.course?.title}</span>
            <span className={styles.sep}>/</span>
            <span className={styles.current}>{data.title}</span>
          </div>
          <span className={styles.progLabel}>
            {currentIndex + 1} / {units.length}
          </span>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <div className={styles.unitHeader}>
            <div className={styles.unitMeta}>
              <span className={styles.unitBadge}>
                Unità {data.order}
              </span>
            </div>
            <h1 className={styles.unitTitle}>{data.title}</h1>
          </div>

          {/* Guida Zendesk */}
          {data.guide && (
            <div className={styles.guideSection}>
              <span className={styles.guideLabel}>Guida di riferimento</span>
              <a
                href={data.guide.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.guideLink}
              >
                <svg viewBox="0 0 14 14" fill="none" width={14} height={14}>
                  <path
                    d="M2 7h10M8 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {data.guide.title} — Guida Zendesk
              </a>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className={styles.footerNav}>
          {prevUnit ? (
            <Link
              href={`/courses/${slug}/${prevUnit.slug}`}
              className={styles.navPrev}
            >
              <svg viewBox="0 0 14 14" fill="none" width={14} height={14}>
                <path
                  d="M9 2L4 7l5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Precedente
            </Link>
          ) : (
            <span />
          )}

          <span className={styles.navCenter}>
            {currentIndex + 1} di {units.length}
          </span>

          {nextUnit ? (
            <Link
              href={`/courses/${slug}/${nextUnit.slug}`}
              className={styles.navNext}
            >
              Continua
              <svg viewBox="0 0 14 14" fill="none" width={14} height={14}>
                <path
                  d="M5 2l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ) : (
            <Link href={`/courses/${slug}`} className={styles.navComplete}>
              ✓ Completa modulo
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}
