'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useProgress } from '@/context/ProgressContext'
import { getBrand, LEVEL_COLORS } from '@/lib/brands'
import { Clock, BarChart2, BookOpen, User, HelpCircle, Award, PlayCircle, CheckCircle2, Lock } from 'lucide-react'
import { api } from '@/lib/api'
import { countableUnits } from '@/lib/courseAccess'
import styles from './CoursePage.module.css'

const PREVIEW_UNITS = 2

export default function CoursePageClient({ course }: { course: any }) {
  const { user, token } = useAuth()
  const { isCompleted, loadCompletedUnitsFromServer } = useProgress()
  const [serverProgress, setServerProgress] = useState<{ total: number; completed: number; percent: number } | null>(null)

  const brand = getBrand(course.software?.slug || '', course.software)
  const levelColor = LEVEL_COLORS[course.level || ''] || 'var(--muted)'
  const overviewUnit = course.units?.find((u: any) => u.unitType === 'OVERVIEW')
  const lessonUnits = countableUnits<any>(course.units)
  const isActive = course.publishState === 'PUBLISHED'

  useEffect(() => {
    if (!user || !token) return
    loadCompletedUnitsFromServer(course.slug)
    api.progress.getCourseProgress(course.slug)
      .then(d => { if (d) setServerProgress(d) })
      .catch(() => {})
  }, [user, token, course.slug])

  const localCompleted = lessonUnits.filter((u: any) => isCompleted(u.id)).length
  const progressPercent = serverProgress?.percent ?? (lessonUnits.length > 0 ? Math.round((localCompleted / lessonUnits.length) * 100) : 0)
  const resumeUnit = lessonUnits.find((u: any) => !isCompleted(u.id)) || lessonUnits[0]
  const remainingUnits = lessonUnits.length - localCompleted
  const isFinished = user && remainingUnits === 0 && lessonUnits.length > 0

  return (
    <div className={styles.page}>

      {/* ── HERO BAND ─────────────────────────────────────────────────── */}
      <div
        className={styles.hero}
        style={{ background: `linear-gradient(160deg, ${brand.light} 0%, #fff 70%)`, borderBottom: `3px solid ${brand.color}` }}
      >
        <div className={styles.heroInner}>

          <nav className={styles.breadcrumb}>
            <Link href="/catalog" className={styles.bcLink}>Catalogo</Link>
            <span className={styles.bcSep}>/</span>
            <span className={styles.bcCurrent}>{course.title}</span>
          </nav>

          <div className={styles.heroTags}>
            <span className={styles.softwareTag} style={{ background: brand.light, color: brand.color, border: `1.5px solid ${brand.color}33` }}>
              {brand.name}
            </span>
            {course.level && (
              <span className={styles.levelTag} style={{ color: levelColor }}>
                {course.level}
              </span>
            )}
            {!isActive && <span className={styles.lockedTag}>Non disponibile</span>}
          </div>

          <h1 className={styles.courseTitle}>{course.title}</h1>
          {course.description && <p className={styles.courseDesc}>{course.description}</p>}

          <div className={styles.heroStats}>
            {course.duration && (
              <span className={styles.heroStat}><Clock size={13} />{course.duration}</span>
            )}
            {lessonUnits.length > 0 && (
              <span className={styles.heroStat}><BookOpen size={13} />{lessonUnits.length} unità</span>
            )}
            {course.level && (
              <span className={styles.heroStat}><BarChart2 size={13} />{course.level}</span>
            )}
          </div>

          <div className={styles.heroActions}>
            {user && isActive && resumeUnit ? (
              <Link
                href={`/courses/${course.slug}/${resumeUnit.slug}`}
                className={styles.heroBtn}
                style={{ background: brand.color, boxShadow: `0 4px 18px ${brand.color}44` }}
              >
                <PlayCircle size={17} />
                {isFinished ? 'Rileggi il corso' : progressPercent > 0 ? 'Continua' : 'Inizia il corso'}
              </Link>
            ) : !user && lessonUnits[0] ? (
              <>
                <Link
                  href={`/courses/${course.slug}/${lessonUnits[0].slug}`}
                  className={styles.heroBtn}
                  style={{ background: brand.color, boxShadow: `0 4px 18px ${brand.color}44` }}
                >
                  <PlayCircle size={17} /> Anteprima gratuita
                </Link>
                <Link href="/auth/login" className={styles.heroBtnGhost}>Accedi →</Link>
              </>
            ) : null}
          </div>

          {user && progressPercent > 0 && (
            <div className={styles.heroProgress}>
              <div className={styles.heroProgressTrack}>
                <div className={styles.heroProgressFill} style={{ width: `${progressPercent}%`, background: brand.color }} />
              </div>
              <span className={styles.heroProgressLabel}>
                {isFinished ? '✓ Completato' : `${progressPercent}% · ${localCompleted}/${lessonUnits.length} unità completate`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────── */}
      <div className={styles.body}>

        {/* Colonna principale */}
        <div className={styles.main}>

          {overviewUnit?.content && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Cosa imparerai</h2>
              <div className={styles.overviewContent} dangerouslySetInnerHTML={{ __html: overviewUnit.content }} />
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.unitSectionHead}>
              <h2 className={styles.sectionTitle}>
                Percorso <span className={styles.unitCount}>· {lessonUnits.length} unità</span>
              </h2>
              {user && progressPercent > 0 && !isFinished && (
                <span className={styles.unitPct}>{progressPercent}% completato</span>
              )}
              {isFinished && (
                <span className={styles.unitPctDone}><CheckCircle2 size={12} /> Completato</span>
              )}
            </div>

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
                      {state === 'done' && <CheckCircle2 size={13} />}
                      {state === 'locked' && <Lock size={11} />}
                      {state === 'available' && <span className={styles.unitNum}>{i + 1}</span>}
                    </div>

                    <div className={styles.unitInfo}>
                      <span className={styles.unitName}>{unit.title}</span>
                      {unit.subtitle && <span className={styles.unitSub}>{unit.subtitle}</span>}
                    </div>

                    <div className={styles.unitRight}>
                      {unit.duration && <span className={styles.unitDuration}>{unit.duration}</span>}
                      {!user && isPreviewUnit && <span className={styles.unitFree}>Gratis</span>}
                      {state === 'done' && <span className={styles.unitDone}>fatto</span>}
                      {state === 'available' && canNavigate && (
                        <svg className={styles.unitArrow} viewBox="0 0 10 10" fill="none" width={10} height={10}>
                          <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>

            {!user && (
              <div className={styles.publicCta}>
                <p>Le prime <strong>{PREVIEW_UNITS} unità</strong> sono gratuite. Accedi per sbloccare il corso completo.</p>
                <Link href="/auth/login" className={styles.publicCtaBtn}>Accedi per continuare →</Link>
                <a href="mailto:support@serviform.com?subject=Richiesta accesso Academy" className={styles.publicCtaLink}>
                  Non hai accesso? Contatta Serviform
                </a>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar sticky */}
        <aside className={styles.sidebar}>

          {/* CTA compatta (ripete l'azione dell'hero per chi ha scrollato) */}
          <div className={styles.sidebarCta}>
            {user && isActive && resumeUnit ? (
              <>
                <Link
                  href={`/courses/${course.slug}/${resumeUnit.slug}`}
                  className={styles.ctaMain}
                  style={{ background: brand.color, boxShadow: `0 2px 14px ${brand.color}40` }}
                >
                  <PlayCircle size={15} />
                  {isFinished ? 'Rileggi' : progressPercent > 0 ? 'Continua' : 'Inizia il corso'}
                </Link>
                {progressPercent > 0 && (
                  <div className={styles.sidebarProgress}>
                    <div className={styles.sidebarProgressTrack}>
                      <div className={styles.sidebarProgressFill} style={{ width: `${progressPercent}%`, background: brand.color }} />
                    </div>
                    <span>{progressPercent}% · {localCompleted}/{lessonUnits.length} unità</span>
                  </div>
                )}
              </>
            ) : !user ? (
              <>
                {lessonUnits[0] && (
                  <Link href={`/courses/${course.slug}/${lessonUnits[0].slug}`} className={styles.ctaPreview}>
                    <PlayCircle size={14} /> Vedi anteprima gratuita
                  </Link>
                )}
                <Link href="/auth/login" className={styles.ctaMain} style={{ background: brand.color }}>
                  Accedi per iniziare
                </Link>
                <p className={styles.ctaNote}>Non hai accesso? <a href="mailto:support@serviform.com">Contatta Serviform</a></p>
              </>
            ) : null}
          </div>

          {/* Badge */}
          {course.issuesBadge && (
            <div className={styles.badgeCard}>
              <div className={styles.badgePreviewWrap}>
                {course.badgeUrl
                  ? <img src={course.badgeUrl} alt="Badge" className={styles.badgeImg} style={{ opacity: remainingUnits > 0 ? 0.4 : 1 }} />
                  : <Award size={52} className={styles.badgeAwardIcon} style={{ opacity: remainingUnits > 0 ? 0.25 : 1 }} />
                }
              </div>
              <p className={styles.badgeTitle}>Badge del corso</p>
              <p className={styles.badgeDesc}>
                {remainingUnits > 0
                  ? `Completa ${remainingUnits} unità per ottenere il certificato`
                  : 'Hai ottenuto il badge!'
                }
              </p>
              <div className={styles.badgeBar}>
                <div className={styles.badgeBarFill} style={{ width: `${progressPercent}%` }} />
              </div>
              <span className={styles.badgeBarLabel}>{progressPercent}% · {localCompleted}/{lessonUnits.length} unità</span>
              {user && (
                <Link href="/profile/certificates" className={styles.badgeLink}>
                  I miei certificati →
                </Link>
              )}
            </div>
          )}

          {/* Aiuto */}
          <div className={styles.helpCard}>
            <a href="mailto:support@serviform.com?subject=Richiesta formatore" className={styles.helpBtn}>
              <User size={13} /> Richiedi un formatore
            </a>
            <a href="https://support.serviform.com" target="_blank" rel="noopener" className={styles.helpBtn}>
              <HelpCircle size={13} /> Guide Zendesk
            </a>
          </div>

        </aside>
      </div>
    </div>
  )
}
