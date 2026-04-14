'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useProgress } from '@/context/ProgressContext'
import { getBrand, LEVEL_COLORS } from '@/lib/brands'
import styles from './CoursePage.module.css'

const PREVIEW_UNITS = 2
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function CoursePageClient({ course }: { course: any }) {
  const { user, token } = useAuth()
  const { isCompleted, loadCompletedUnitsFromServer } = useProgress()
  const [serverProgress, setServerProgress] = useState<{ total: number; completed: number; percent: number } | null>(null)

  const brand = getBrand(course.software?.slug || '')
  const levelColor = LEVEL_COLORS[course.level || ''] || 'var(--muted)'
  const overviewUnit = course.units?.find((u: any) => u.unitType === 'OVERVIEW')
  const lessonUnits = course.units?.filter((u: any) => u.unitType !== 'OVERVIEW') || []
  const isActive = course.publishState === 'PUBLISHED'

  useEffect(() => {
    if (!user || !token) return
    loadCompletedUnitsFromServer(course.slug)
    fetch(`${API_URL}/progress/course/${course.slug}`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setServerProgress(d) })
      .catch(() => {})
  }, [user, token, course.slug])

  const localCompleted = lessonUnits.filter((u: any) => isCompleted(u.id)).length
  const progressPercent = serverProgress?.percent ?? (lessonUnits.length > 0 ? Math.round((localCompleted / lessonUnits.length) * 100) : 0)
  const resumeUnit = lessonUnits.find((u: any) => !isCompleted(u.id)) || lessonUnits[0]

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link href="/catalog" className={styles.bcLink}>Catalogo</Link>
        <span className={styles.bcSep}>/</span>
        <span className={styles.bcCurrent}>{course.title}</span>
      </div>

      <div className={styles.layout}>
        {/* Sinistra */}
        <div className={styles.left}>
          <div className={styles.courseHeader}>
            <span className={styles.softwareTag} style={{background:brand.light,color:brand.color}}>{brand.name}</span>
            <h1 className={styles.courseTitle}>{course.title}</h1>
            {course.description && <p className={styles.courseDesc}>{course.description}</p>}
          </div>

          {overviewUnit?.content && (
            <div className={styles.overview}>
              <h2 className={styles.overviewTitle}>Cosa imparerai</h2>
              <div className={styles.overviewContent} dangerouslySetInnerHTML={{__html: overviewUnit.content}}/>
            </div>
          )}

          <div className={styles.unitSection}>
            <div className={styles.unitSectionHeader}>
              <h2 className={styles.unitSectionTitle}>Percorso — {lessonUnits.length} unità</h2>
              {user && progressPercent > 0 && <span className={styles.unitSectionPct}>{progressPercent}% completato</span>}
            </div>

            {user && progressPercent > 0 && (
              <div className={styles.courseProgressBar}>
                <div className={styles.courseProgressFill} style={{width:`${progressPercent}%`}}/>
              </div>
            )}

            <div className={styles.unitList}>
              {lessonUnits.map((unit: any, i: number) => {
                const done = isCompleted(unit.id)
                const isPreviewUnit = i < PREVIEW_UNITS
                const canNavigate = user ? isActive : isPreviewUnit
                const state = user ? (done ? 'done' : 'available') : (isPreviewUnit ? 'available' : 'locked')
                return (
                  <Link
                    key={unit.id}
                    href={canNavigate ? `/courses/${course.slug}/${unit.slug}` : '#'}
                    className={[styles.unitItem, styles[`unitItem_${state}`]].join(' ')}
                    onClick={!canNavigate ? e => e.preventDefault() : undefined}
                  >
                    <div className={styles.unitIndicator} data-state={state}>
                      {state === 'done' && <svg viewBox="0 0 16 16" fill="none" width={10} height={10}><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {state === 'locked' && <svg viewBox="0 0 14 14" fill="none" width={9} height={9}><rect x="1" y="6" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3.5 6V4.5a3.5 3.5 0 017 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>}
                      {(state === 'available') && <span style={{fontFamily:'var(--font-mono)',fontSize:9,fontWeight:700}}>{i+1}</span>}
                    </div>
                    <div className={styles.unitInfo}>
                      <span className={styles.unitTitle}>{unit.title}</span>
                      {unit.subtitle && <span className={styles.unitSubtitle}>{unit.subtitle}</span>}
                    </div>
                    <div className={styles.unitRight}>
                      {unit.duration && <span className={styles.unitDuration}>{unit.duration}</span>}
                      {state === 'done' && <span className={styles.unitDoneLabel}>fatto</span>}
                      {!user && isPreviewUnit && <span className={styles.unitPreviewLabel}>gratis</span>}
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* CTA per non loggati */}
            {!user && (
              <div className={styles.publicCta}>
                <p>Le prime <strong>{PREVIEW_UNITS} unità</strong> sono gratuite. Accedi per sbloccare il corso completo.</p>
                <Link href="/auth/login" className={styles.publicCtaBtn}>Accedi per continuare →</Link>
                <a href="mailto:support@serviform.com?subject=Richiesta accesso Academy" className={styles.publicCtaLink}>Non hai accesso? Contatta Serviform</a>
              </div>
            )}
          </div>
        </div>

        {/* Destra sticky */}
        <div className={styles.right}>
          <div className={styles.sidebar}>
            <div className={styles.metaCard}>
              {[
                course.duration && { icon: '⏱', label: 'Durata', value: course.duration },
                course.level && { icon: '📊', label: 'Livello', value: course.level, color: levelColor },
                lessonUnits.length > 0 && { icon: '📋', label: 'Unità', value: `${lessonUnits.length} lezioni` },
              ].filter(Boolean).map((m: any, i: number) => (
                <div key={i} className={styles.metaRow}>
                  <span className={styles.metaIcon}>{m.icon}</span>
                  <div className={styles.metaContent}>
                    <span className={styles.metaLabel}>{m.label}</span>
                    <span className={styles.metaValue} style={m.color ? {color:m.color} : {}}>{m.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.ctaCard}>
              {user ? (
                <>
                  {isActive && resumeUnit && (
                    <Link href={`/courses/${course.slug}/${resumeUnit.slug}`} className={styles.ctaMain}>
                      <svg viewBox="0 0 16 16" fill="none" width={15} height={15}><path d="M5 3l8 5-8 5V3z" fill="currentColor"/></svg>
                      {progressPercent > 0 ? 'Continua il corso' : 'Inizia il corso'}
                    </Link>
                  )}
                  {progressPercent > 0 && (
                    <div className={styles.progressInfo}>
                      <div className={styles.progressInfoBar}><div className={styles.progressInfoFill} style={{width:`${progressPercent}%`}}/></div>
                      <span>{progressPercent}% · {localCompleted}/{lessonUnits.length} unità</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {lessonUnits[0] && (
                    <Link href={`/courses/${course.slug}/${lessonUnits[0].slug}`} className={styles.ctaPreview}>
                      <svg viewBox="0 0 16 16" fill="none" width={14} height={14}><path d="M5 3l8 5-8 5V3z" fill="currentColor"/></svg>
                      Vedi anteprima gratuita
                    </Link>
                  )}
                  <Link href="/auth/login" className={styles.ctaMain}>Accedi per iniziare</Link>
                  <p className={styles.ctaNote}>Non hai accesso? <a href="mailto:support@serviform.com">Contatta Serviform</a></p>
                </>
              )}
              <div className={styles.ctaSecondary}>
                <a href="mailto:support@serviform.com?subject=Richiesta formatore" className={styles.ctaSecondaryBtn}>👤 Richiedi un formatore</a>
                <a href="https://support.serviform.com" target="_blank" rel="noopener" className={styles.ctaSecondaryBtn}>❓ Guide Zendesk</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
