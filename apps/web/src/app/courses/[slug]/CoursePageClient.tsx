'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useProgress } from '@/context/ProgressContext'
import { getBrand, LEVEL_COLORS } from '@/lib/brands'
import styles from './CoursePage.module.css'

const PREVIEW_UNIT_COUNT = 2

interface CoursePageClientProps {
  course: any
}

export default function CoursePageClient({ course }: CoursePageClientProps) {
  const { user } = useAuth()
  const { isCompleted, loadCompletedUnitsFromServer } = useProgress()
  const [serverProgress, setServerProgress] = useState<{
    total: number; completed: number; percent: number
  } | null>(null)

  const brand = getBrand(course.software?.slug || '')
  const levelColor = LEVEL_COLORS[course.level || ''] || 'var(--muted)'
  const overviewUnit = course.units?.find((u: any) => u.unitType === 'OVERVIEW')
  const lessonUnits = course.units?.filter((u: any) => u.unitType !== 'OVERVIEW') || []

  const isActive = course.publishState === 'PUBLISHED' && course.available
  const isLocked = !isActive && course.publishState !== 'HIDDEN'

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const token = typeof window !== 'undefined' ? localStorage.getItem('sa_token') : null

  // Carica le unità completate dal server e il progresso aggregato
  useEffect(() => {
    if (!user || !token) return

    // 1. Popola il ProgressContext con le unità già completate
    loadCompletedUnitsFromServer(course.slug)

    // 2. Carica il progresso aggregato per mostrare la barra
    fetch(`${API_URL}/progress/course/${course.slug}`, {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setServerProgress(data) })
      .catch(() => {})
  }, [user, token, course.slug, loadCompletedUnitsFromServer])

  // Progresso calcolato dal Set locale (aggiornato anche senza server round-trip)
  const localCompleted = lessonUnits.filter((u: any) => isCompleted(u.id)).length
  const progressPercent = lessonUnits.length > 0
    ? Math.round((localCompleted / lessonUnits.length) * 100)
    : 0

  // Prima unità non completata (per il resume)
  const resumeUnit = lessonUnits.find((u: any) => !isCompleted(u.id)) || lessonUnits[0]

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link href="/catalog" className={styles.breadcrumbLink}>Catalogo</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{course.title}</span>
      </div>

      <div className={styles.layout}>
        {/* ── Sinistra ── */}
        <div className={styles.left}>
          <div className={styles.courseHeader}>
            <span className={styles.softwareTag} style={{ background: brand.light, color: brand.color }}>
              {brand.name}
            </span>
            <h1 className={styles.courseTitle}>{course.title}</h1>
            {course.description && <p className={styles.courseDesc}>{course.description}</p>}
          </div>

          {overviewUnit?.content && (
            <div className={styles.overview}>
              <h2 className={styles.overviewTitle}>Cosa imparerai</h2>
              <div className={styles.overviewContent} dangerouslySetInnerHTML={{ __html: overviewUnit.content }} />
            </div>
          )}

          {/* Lista unità con stati */}
          <div className={styles.unitSection}>
            <div className={styles.unitSectionHeader}>
              <h2 className={styles.unitSectionTitle}>
                Percorso — {lessonUnits.length} unità
              </h2>
              {user && progressPercent > 0 && (
                <span className={styles.unitSectionPct}>{progressPercent}% completato</span>
              )}
            </div>

            {/* Barra di progresso del corso */}
            {user && progressPercent > 0 && (
              <div className={styles.courseProgressBar}>
                <div className={styles.courseProgressFill} style={{ width: `${progressPercent}%` }} />
              </div>
            )}

            <div className={styles.unitList}>
              {lessonUnits.map((unit: any, i: number) => {
                const done = isCompleted(unit.id)
                const isPreview = !user && i < PREVIEW_UNIT_COUNT
                const lockedForPublic = !user && i >= PREVIEW_UNIT_COUNT
                const unitState: 'done' | 'available' | 'locked' =
                  done ? 'done' : lockedForPublic ? 'locked' : 'available'

                const canNavigate = user ? (isActive) : isPreview

                return (
                  <Link
                    key={unit.id}
                    href={canNavigate ? `/courses/${course.slug}/${unit.slug}` : '#'}
                    className={[
                      styles.unitItem,
                      styles[`unitItem_${unitState}`],
                    ].join(' ')}
                    onClick={!canNavigate ? e => e.preventDefault() : undefined}
                  >
                    <div className={styles.unitIndicator} data-state={unitState}>
                      {unitState === 'done' && (
                        <svg viewBox="0 0 16 16" fill="none" width={10} height={10}>
                          <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {unitState === 'locked' && (
                        <svg viewBox="0 0 14 14" fill="none" width={9} height={9}>
                          <rect x="1" y="6" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M4 6V4.5a3 3 0 016 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      )}
                      {unitState === 'available' && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700 }}>{i + 1}</span>
                      )}
                    </div>

                    <div className={styles.unitInfo}>
                      <span className={styles.unitTitle}>{unit.title}</span>
                      {unit.subtitle && <span className={styles.unitSubtitle}>{unit.subtitle}</span>}
                    </div>

                    <div className={styles.unitRight}>
                      {unit.duration && <span className={styles.unitDuration}>{unit.duration}</span>}
                      {unitState === 'done' && <span className={styles.unitDoneLabel}>fatto</span>}
                      {isPreview && !user && (
                        <span className={styles.unitPreviewLabel}>anteprima</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* CTA per non loggati */}
            {!user && (
              <div className={styles.publicCta}>
                <p>Hai visualizzato {PREVIEW_UNIT_COUNT} unità gratuitamente.</p>
                <Link href="/auth/login" className={styles.publicCtaBtn}>
                  Accedi per sbloccare tutto il corso →
                </Link>
                <a href="mailto:support@serviform.com?subject=Richiesta accesso Academy" className={styles.publicCtaLink}>
                  Non hai accesso? Contatta Serviform
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── Destra sticky ── */}
        <div className={styles.right}>
          <div className={styles.sidebar}>
            {/* Metadati */}
            <div className={styles.metaCard}>
              {[
                course.duration && { icon: '⏱', label: 'Durata', value: course.duration },
                course.level && { icon: '📊', label: 'Livello', value: course.level, color: levelColor },
                lessonUnits.length > 0 && { icon: '📋', label: 'Unità', value: `${lessonUnits.length} lezioni` },
                course.objective && { icon: '🎯', label: 'Obiettivo', value: course.objective },
              ].filter(Boolean).map((m: any, i: number) => (
                <div key={i} className={styles.metaRow}>
                  <span className={styles.metaIcon}>{m.icon}</span>
                  <div className={styles.metaContent}>
                    <span className={styles.metaLabel}>{m.label}</span>
                    <span className={styles.metaValue} style={m.color ? { color: m.color } : {}}>{m.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className={styles.ctaCard}>
              {user ? (
                <>
                  {isActive && resumeUnit && (
                    <Link href={`/courses/${course.slug}/${resumeUnit.slug}`} className={styles.ctaMain}>
                      <svg viewBox="0 0 16 16" fill="none" width={16} height={16}>
                        <path d="M5 3l8 5-8 5V3z" fill="currentColor" />
                      </svg>
                      {progressPercent > 0 ? 'Continua il corso' : 'Inizia il corso'}
                    </Link>
                  )}
                  {isLocked && (
                    <div className={styles.ctaLocked}>
                      <svg viewBox="0 0 20 20" fill="none" width={20} height={20}>
                        <rect x="3" y="9" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span>Accesso non disponibile</span>
                      <p>Contatta il tuo amministratore per richiedere l'accesso.</p>
                    </div>
                  )}
                  {progressPercent > 0 && (
                    <div className={styles.progressInfo}>
                      <div className={styles.progressInfoBar}>
                        <div className={styles.progressInfoFill} style={{ width: `${progressPercent}%` }} />
                      </div>
                      <span>{progressPercent}% · {localCompleted}/{lessonUnits.length} unità</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {lessonUnits[0] && (
                    <Link href={`/courses/${course.slug}/${lessonUnits[0].slug}`} className={styles.ctaPreview}>
                      <svg viewBox="0 0 16 16" fill="none" width={15} height={15}>
                        <path d="M5 3l8 5-8 5V3z" fill="currentColor" />
                      </svg>
                      Vedi anteprima gratuita
                    </Link>
                  )}
                  <Link href="/auth/login" className={styles.ctaMain}>
                    Accedi per iniziare
                  </Link>
                  <p className={styles.ctaNote}>
                    Non hai accesso?{' '}
                    <a href="mailto:support@serviform.com?subject=Richiesta accesso Academy">
                      Contatta Serviform
                    </a>
                  </p>
                </>
              )}

              <div className={styles.ctaSecondary}>
                <a href="mailto:support@serviform.com?subject=Richiesta formatore" className={styles.ctaSecondaryBtn}>
                  <svg viewBox="0 0 16 16" fill="none" width={13} height={13}>
                    <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  Richiedi un formatore
                </a>
                <a href="https://support.serviform.com" target="_blank" rel="noopener" className={styles.ctaSecondaryBtn}>
                  <svg viewBox="0 0 16 16" fill="none" width={13} height={13}>
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M6 6.5a2 2 0 114 0c0 1-1 1.5-2 2M8 11.5v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Guide Zendesk
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
