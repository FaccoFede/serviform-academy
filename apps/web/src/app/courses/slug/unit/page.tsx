'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useProgress } from '@/context/ProgressContext'
import { getBrand } from '@/lib/brands'
import VideoPlayer from '@/components/features/VideoPlayer'
import ExerciseCard from '@/components/features/ExerciseCard'
import styles from './UnitPage.module.css'
import { api } from '@/lib/api'

const PREVIEW_UNITS = 2

export default function UnitPage({ params }: { params: Promise<{ slug: string; unit: string }> }) {
  const { slug, unit: unitSlug } = use(params)
  const { user } = useAuth()
  const { markCompleted, markViewed, isCompleted, loadCompletedUnitsFromServer } = useProgress()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug || !unitSlug) return
    api.units.findBySlug(slug, unitSlug)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug, unitSlug])

  useEffect(() => {
    if (user && slug) loadCompletedUnitsFromServer(slug)
  }, [user, slug])

  useEffect(() => {
    if (user && data?.id) markViewed(data.id)
  }, [user, data?.id])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--topbar-h))', color: 'var(--muted)', fontSize: 14 }}>
      Caricamento...
    </div>
  )
  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--topbar-h))', color: 'var(--muted)', fontSize: 14 }}>
      Unità non trovata.{' '}
      <Link href={`/courses/${slug}`} style={{ color: 'var(--red)', fontWeight: 700, marginLeft: 8 }}>Torna al corso</Link>
    </div>
  )

  const units = (data.course?.units || []).filter((u: any) => u.unitType !== 'OVERVIEW')
  const currentIndex = units.findIndex((u: any) => u.slug === unitSlug)
  const prevUnit = currentIndex > 0 ? units[currentIndex - 1] : null
  const nextUnit = currentIndex < units.length - 1 ? units[currentIndex + 1] : null
  const brand = getBrand(data.course?.software?.slug || '')
  const isCurrentDone = isCompleted(data.id)
  const isPreview = currentIndex < PREVIEW_UNITS
  const isLocked = !user && !isPreview

  const completedCount = units.filter((u: any) => isCompleted(u.id)).length
  const progressPercent = units.length > 0
    ? Math.round((completedCount / units.length) * 100)
    : 0

  async function handleComplete() {
    await markCompleted(data.id)
    if (nextUnit) window.location.href = `/courses/${slug}/${nextUnit.slug}`
    else window.location.href = `/courses/${slug}`
  }

  // ── Vista locked ──────────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <main className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <Link href={`/courses/${slug}`} className={styles.sidebarBack}>
              <svg viewBox="0 0 14 14" fill="none" width={13} height={13}><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>{data.course?.title}</span>
            </Link>
            <span className={styles.sidebarTag} style={{ background: brand.light, color: brand.color }}>{brand.name}</span>
          </div>
          <nav className={styles.sidebarUnits}>
            {units.map((u: any, i: number) => {
              const preview = i < PREVIEW_UNITS
              const current = u.slug === unitSlug
              return (
                <div key={u.id} className={[styles.unitItem, current ? styles.unit_current : '', !preview ? styles.unit_locked : ''].join(' ')}>
                  <div className={styles.unitDot} data-state={!preview ? 'locked' : current ? 'current' : 'available'}>
                    {!preview && <svg viewBox="0 0 12 14" fill="none" width={8}><rect x="1.5" y="5" width="9" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>}
                    {preview && current && <div className={styles.currentPulse}/>}
                    {preview && !current && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700 }}>{i + 1}</span>}
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
          <div className={styles.lockedBox}>
            <div className={styles.lockedIcon}>🔒</div>
            <h2 className={styles.lockedTitle}>Accedi per continuare</h2>
            <p className={styles.lockedDesc}>Hai visualizzato le prime {PREVIEW_UNITS} unità in anteprima gratuita. Accedi per sbloccare il resto del corso.</p>
            <Link href="/auth/login" className={styles.lockedBtn}>Accedi o registrati →</Link>
          </div>
        </section>
      </main>
    )
  }

  // ── Vista normale ─────────────────────────────────────────────────────────
  return (
    <main className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href={`/courses/${slug}`} className={styles.sidebarBack}>
            <svg viewBox="0 0 14 14" fill="none" width={13} height={13}><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>{data.course?.title}</span>
          </Link>
          <span className={styles.sidebarTag} style={{ background: brand.light, color: brand.color }}>{brand.name}</span>
        </div>

        <div className={styles.sidebarProgress}>
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>Completato</span>
            <span className={styles.progressValue}>{completedCount}/{units.length}</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}/>
          </div>
        </div>

        <nav className={styles.sidebarUnits}>
          {units.map((u: any, i: number) => {
            const done = isCompleted(u.id)
            const isCurrent = u.slug === unitSlug
            const state = done ? 'done' : isCurrent ? 'current' : 'available'
            return (
              <Link key={u.id} href={`/courses/${slug}/${u.slug}`} className={[styles.unitItem, styles[`unit_${state}`]].join(' ')}>
                <div className={styles.unitDot} data-state={state}>
                  {state === 'done' && <svg viewBox="0 0 12 12" fill="none" width={8} height={8}><path d="M2 6l2.5 2.5L10 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  {state === 'current' && <div className={styles.currentPulse}/>}
                  {state === 'available' && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700 }}>{i + 1}</span>}
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

      {/* Contenuto */}
      <section className={styles.content}>
        <div className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <Link href={`/courses/${slug}`} className={styles.bcLink}>{data.course?.title}</Link>
            <span className={styles.bcSep}>/</span>
            <span className={styles.bcCurrent}>{data.title}</span>
          </div>
          <div className={styles.topbarRight}>
            {isCurrentDone && <span className={styles.doneBadge}>✓ Completata</span>}
            {!user && isPreview && <span className={styles.previewBadge}>Anteprima gratuita</span>}
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

          {/* ── VIDEO PLAYER ─────────────────────────────────────────────── */}
          
          {data.videoUrl && (
            <VideoPlayer
              url={data.videoUrl}
              title={data.title}
              duration={data.duration}
            />
          )}

          {/* ── CONTENUTO HTML ───────────────────────────────────────────── */}
          {data.content && (
            <div className={styles.richContent} dangerouslySetInnerHTML={{ __html: data.content }}/>
          )}

          {!data.videoUrl && !data.content && (
            <p style={{ color: 'var(--muted)', padding: '40px 0', textAlign: 'center' }}>
              Nessun contenuto per questa unità.
            </p>
          )}

          {/* ── GUIDA ZENDESK ────────────────────────────────────────────── */}
          {data.guide && (
            <div className={styles.guideSection}>
              <span className={styles.guideLabel}>Guida di riferimento Zendesk</span>
              <a href={data.guide.url} target="_blank" rel="noopener" className={styles.guideLink}>
                → {data.guide.title}
              </a>
            </div>
          )}

          {/* ── ESERCITAZIONI ────────────────────────────────────────────── */}
          {data.exercises?.length > 0 && (
            <div className={styles.exercisesSection}>
              <h3 className={styles.exercisesTitle}>Esercitazioni pratiche</h3>
              {data.exercises.map((ex: any) => (
                <ExerciseCard key={ex.id} title={ex.title} description={ex.description} htmlUrl={ex.htmlUrl} evdUrl={ex.evdUrl}/>
              ))}
            </div>
          )}
        </div>

        {/* ── FOOTER NAV ───────────────────────────────────────────────── */}
        <div className={styles.footerNav}>
          {prevUnit
            ? <Link href={`/courses/${slug}/${prevUnit.slug}`} className={styles.navBtn}>← Precedente</Link>
            : <span/>
          }
          <span className={styles.navCenter}>{currentIndex + 1} di {units.length}</span>
          {user ? (
            !isCurrentDone ? (
              <button className={styles.navComplete} onClick={handleComplete}>
                {nextUnit ? '✓ Completa e continua' : '✓ Completa il modulo'}
              </button>
            ) : nextUnit ? (
              <Link href={`/courses/${slug}/${nextUnit.slug}`} className={styles.navNext}>Continua →</Link>
            ) : (
              <Link href={`/courses/${slug}`} className={styles.navFinish}>Torna al corso →</Link>
            )
          ) : nextUnit && currentIndex < PREVIEW_UNITS - 1 ? (
            <Link href={`/courses/${slug}/${nextUnit.slug}`} className={styles.navNext}>Continua anteprima →</Link>
          ) : (
            <Link href="/auth/login" className={styles.navComplete}>Accedi per continuare →</Link>
          )}
        </div>
      </section>
    </main>
  )
}
