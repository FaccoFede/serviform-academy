'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useProgress } from '@/context/ProgressContext'
import { getBrand } from '@/lib/brands'
import ExerciseCard from '@/components/features/ExerciseCard'
import styles from './UnitPage.module.css'

const PREVIEW_UNIT_COUNT = 2 // prime N unità accessibili senza login

interface UnitPageClientProps {
  data: any
  slug: string
  unitSlug: string
}

export default function UnitPageClient({ data, slug, unitSlug }: UnitPageClientProps) {
  const { user } = useAuth()
  const { markCompleted, markViewed, isCompleted, loadCompletedUnitsFromServer } = useProgress()

  const units = (data.course?.units || []).filter((u: any) => u.unitType !== 'OVERVIEW')
  const currentIndex = units.findIndex((u: any) => u.slug === unitSlug)
  const prevUnit = currentIndex > 0 ? units[currentIndex - 1] : null
  const nextUnit = currentIndex < units.length - 1 ? units[currentIndex + 1] : null
  const brand = getBrand(data.course?.software?.slug || '')
  const isCurrentDone = isCompleted(data.id)

  // Determina se questa unità è in preview pubblica (prime 2 senza login)
  const isPreviewUnit = currentIndex < PREVIEW_UNIT_COUNT
  const isLocked = !user && !isPreviewUnit

  // Progresso reale basato sulle unità completate nel Set
  const completedCount = units.filter((u: any) => isCompleted(u.id)).length
  const progressPercent = units.length > 0
    ? Math.round((completedCount / units.length) * 100)
    : 0

  // Al mount: carica unità già completate dal server (fix bug pallino che si svuota)
  useEffect(() => {
    if (user && data.course?.slug) {
      loadCompletedUnitsFromServer(data.course.slug)
    }
  }, [user, data.course?.slug, loadCompletedUnitsFromServer])

  // Segna come "viewed" per il resume in dashboard
  useEffect(() => {
    if (user && data.id) {
      markViewed(data.id)
    }
  }, [user, data.id, markViewed])

  async function handleComplete() {
    await markCompleted(data.id)
    if (nextUnit) {
      window.location.href = `/courses/${slug}/${nextUnit.slug}`
    } else {
      window.location.href = `/courses/${slug}`
    }
  }

  // ── Vista locked per utenti non loggati oltre le prime 2 unità ──
  if (isLocked) {
    return (
      <main className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <Link href={`/courses/${slug}`} className={styles.sidebarBack}>
              <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{data.course?.title}</span>
            </Link>
            <span className={styles.sidebarTag} style={{ background: brand.light, color: brand.color }}>
              {brand.name}
            </span>
          </div>
          <div className={styles.sidebarProgress}>
            <div className={styles.progressRow}>
              <span className={styles.progressLabel}>Anteprima</span>
              <span className={styles.progressValue}>{PREVIEW_UNIT_COUNT} / {units.length}</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${Math.round((PREVIEW_UNIT_COUNT / units.length) * 100)}%` }} />
            </div>
          </div>
          <nav className={styles.sidebarUnits}>
            {units.map((u: any, i: number) => {
              const preview = i < PREVIEW_UNIT_COUNT
              const current = u.slug === unitSlug
              return (
                <div
                  key={u.id}
                  className={[
                    styles.unitItem,
                    current ? styles.unit_current : '',
                    !preview ? styles.unit_locked_item : '',
                  ].filter(Boolean).join(' ')}
                >
                  <div className={styles.unitDot} data-state={current ? 'current' : preview ? 'available' : 'locked'}>
                    {!preview
                      ? <svg viewBox="0 0 12 12" fill="none" width={9} height={9}><rect x="1" y="5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M3.5 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                      : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700 }}>{i + 1}</span>
                    }
                  </div>
                  <div className={styles.unitText}>
                    <span className={styles.unitName}>{u.title}</span>
                    {u.duration && <span className={styles.unitDur}>{u.duration}</span>}
                  </div>
                </div>
              )
            })}
          </nav>
        </aside>

        <section className={styles.content}>
          <div className={styles.topbar}>
            <div className={styles.breadcrumb}>
              <Link href={`/courses/${slug}`} className={styles.bcLink}>{data.course?.title}</Link>
              <span className={styles.bcSep}>/</span>
              <span className={styles.bcCurrent}>{data.title}</span>
            </div>
            <span className={styles.counter}>{currentIndex + 1} / {units.length}</span>
          </div>

          {/* Contenuto bloccato con overlay */}
          <div className={styles.lockedContent}>
            <div className={styles.lockedOverlay}>
              <div className={styles.lockedBox}>
                <div className={styles.lockedIcon}>
                  <svg viewBox="0 0 48 48" fill="none" width={48} height={48}>
                    <rect x="8" y="20" width="32" height="24" rx="4" stroke="var(--ink)" strokeWidth="2"/>
                    <path d="M16 20V14a8 8 0 0116 0v6" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="24" cy="32" r="3" fill="var(--red)"/>
                  </svg>
                </div>
                <h2 className={styles.lockedTitle}>Contenuto riservato</h2>
                <p className={styles.lockedDesc}>
                  Hai visualizzato le prime {PREVIEW_UNIT_COUNT} unità gratuitamente.
                  Per continuare il corso e accedere a tutti i contenuti, devi effettuare l'accesso con un account abilitato.
                </p>
                <div className={styles.lockedActions}>
                  <Link href="/auth/login" className={styles.lockedCta}>
                    Accedi per continuare
                  </Link>
                  <a
                    href="mailto:support@serviform.com?subject=Richiesta accesso Academy"
                    className={styles.lockedContact}
                  >
                    Non hai accesso? Contatta Serviform →
                  </a>
                </div>
                <p className={styles.lockedNote}>
                  Puoi tornare al corso per vedere la struttura completa e le informazioni sul modulo.
                </p>
              </div>
            </div>

            {/* Contenuto sfocato in background per dare senso del valore */}
            <div className={styles.blurredContent} aria-hidden>
              {data.content && (
                <div className={styles.richContent} dangerouslySetInnerHTML={{ __html: data.content }} />
              )}
            </div>
          </div>

          <div className={styles.footerNav}>
            {prevUnit ? (
              <Link href={`/courses/${slug}/${prevUnit.slug}`} className={styles.navBtn}>
                <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
                  <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Precedente
              </Link>
            ) : <span />}
            <span className={styles.navCenter}>{currentIndex + 1} di {units.length}</span>
            <Link href="/auth/login" className={styles.navComplete}>
              Accedi per continuare →
            </Link>
          </div>
        </section>
      </main>
    )
  }

  // ── Vista normale (utente loggato o preview) ──
  return (
    <main className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href={`/courses/${slug}`} className={styles.sidebarBack}>
            <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{data.course?.title}</span>
          </Link>
          <span className={styles.sidebarTag} style={{ background: brand.light, color: brand.color }}>
            {brand.name}
          </span>
        </div>

        {/* Progress bar reale */}
        <div className={styles.sidebarProgress}>
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>Progresso</span>
            <span className={styles.progressValue}>{progressPercent}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
          <span className={styles.progressSub}>{completedCount} di {units.length} unità completate</span>
        </div>

        {/* Lista unità con stati visivi */}
        <nav className={styles.sidebarUnits}>
          {units.map((u: any, i: number) => {
            const done = isCompleted(u.id)
            const isCurrent = u.slug === unitSlug
            const state: 'done' | 'current' | 'available' = done ? 'done' : isCurrent ? 'current' : 'available'

            return (
              <Link
                key={u.id}
                href={`/courses/${slug}/${u.slug}`}
                className={[styles.unitItem, styles[`unit_${state}`]].join(' ')}
              >
                <div className={styles.unitDot} data-state={state}>
                  {state === 'done' && (
                    <svg viewBox="0 0 12 12" fill="none" width={8} height={8}>
                      <path d="M2 6l2.5 2.5L10 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {state === 'current' && <div className={styles.currentPulse} />}
                  {state === 'available' && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700 }}>{i + 1}</span>
                  )}
                </div>
                <div className={styles.unitText}>
                  <span className={styles.unitName}>{u.title}</span>
                  {u.duration && <span className={styles.unitDur}>{u.duration}</span>}
                </div>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Area contenuto */}
      <section className={styles.content}>
        <div className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <Link href={`/courses/${slug}`} className={styles.bcLink}>{data.course?.title}</Link>
            <span className={styles.bcSep}>/</span>
            <span className={styles.bcCurrent}>{data.title}</span>
          </div>
          <div className={styles.topbarRight}>
            {isCurrentDone && <span className={styles.doneBadge}>✓ Completata</span>}
            {!user && isPreviewUnit && (
              <span className={styles.previewBadge}>Anteprima gratuita</span>
            )}
            <span className={styles.counter}>{currentIndex + 1} / {units.length}</span>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.unitHeader}>
            <div className={styles.unitMeta}>
              <span className={styles.unitBadge}>Unità {data.order}</span>
              {data.duration && <span className={styles.unitBadge}>{data.duration}</span>}
              {data.unitType === 'EXERCISE' && <span className={styles.unitBadgeEx}>Esercitazione</span>}
            </div>
            <h1 className={styles.unitTitle}>{data.title}</h1>
            {data.subtitle && <p className={styles.unitSubtitle}>{data.subtitle}</p>}
          </div>

          {data.content && (
            <div className={styles.richContent} dangerouslySetInnerHTML={{ __html: data.content }} />
          )}

          {(data.guides?.length > 0 || data.guide) && (
     <div className={styles.guideSection}>
       <span className={styles.guideLabel}>
         {(data.guides?.length || 1) > 1 ? 'Guide di riferimento' : 'Guida di riferimento'}
       </span>
       {/* Supporta sia il vecchio campo guide (singolo) che il nuovo guides (array) */}
       {(data.guides?.length > 0 ? data.guides : [data.guide]).map((g: any) => (
         <a
           key={g.id}
           href={g.url}
           target="_blank"
           rel="noopener noreferrer"
           className={styles.guideLink}
         >
           <svg viewBox="0 0 16 16" fill="none" width={13} height={13}>
             <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h10a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
             <path d="M9 2h5v5M14 2L8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
           </svg>
           {g.title}
         </a>
       ))}
     </div>
   )}

          {data.exercises?.length > 0 && (
            <div className={styles.exercisesSection}>
              <h3 className={styles.exercisesTitle}>Esercitazioni pratiche</h3>
              {data.exercises.map((ex: any) => (
                <ExerciseCard key={ex.id} title={ex.title} description={ex.description} htmlUrl={ex.htmlUrl} evdUrl={ex.evdUrl} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.footerNav}>
          {prevUnit ? (
            <Link href={`/courses/${slug}/${prevUnit.slug}`} className={styles.navBtn}>
              <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Precedente
            </Link>
          ) : <span />}

          <span className={styles.navCenter}>{currentIndex + 1} di {units.length}</span>

          {user ? (
            !isCurrentDone ? (
              <button className={styles.navComplete} onClick={handleComplete}>
                {nextUnit ? '✓ Completa e continua' : '✓ Completa il modulo'}
              </button>
            ) : nextUnit ? (
              <Link href={`/courses/${slug}/${nextUnit.slug}`} className={styles.navNext}>
                Continua
                <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
                  <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ) : (
              <Link href={`/courses/${slug}`} className={styles.navFinish}>Torna al corso →</Link>
            )
          ) : nextUnit && currentIndex < PREVIEW_UNIT_COUNT - 1 ? (
            <Link href={`/courses/${slug}/${nextUnit.slug}`} className={styles.navNext}>
              Continua anteprima
              <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
                <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : (
            <Link href="/auth/login" className={styles.navComplete}>
              Accedi per continuare →
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}
