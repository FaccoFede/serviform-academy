'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import AnnouncementModal from '@/components/ui/AnnouncementModal'
import EventModal from '@/components/ui/EventModal'
import { getBrand } from '@/lib/brands'
import { api } from '@/lib/api'
import styles from './DashboardPage.module.css'

const SECTION_LABELS: Record<string, string> = {
  COMUNICAZIONE: 'Comunicazione', NEW_COURSE: 'Nuovo corso', WEBINAR: 'Webinar',
  MAINTENANCE: 'Manutenzione', EVENTO: 'Evento', WORKSHOP: 'Workshop',
  NEWS: 'Novità', EVENTS: 'Evento', PRESS: 'Comunicato', RULES: 'Regola',
}
const SECTION_COLORS: Record<string, string> = {
  COMUNICAZIONE: '#067DB8', NEW_COURSE: '#E63329', WEBINAR: '#059669',
  MAINTENANCE: '#D97706', EVENTO: '#059669', WORKSHOP: '#D97706',
  NEWS: '#067DB8', EVENTS: '#059669', PRESS: '#7C3AED', RULES: '#D97706',
}
const EV_TYPE_LABELS: Record<string, string> = {
  WEBINAR: 'Webinar', WORKSHOP: 'Workshop', LIVE_SESSION: 'Sessione live', EVENTO: 'Evento',
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatShortDate(d: string) {
  if (!d) return { day: '--', month: '---' }
  const date = new Date(d)
  return {
    day: date.toLocaleDateString('it-IT', { day: '2-digit' }),
    month: date.toLocaleDateString('it-IT', { month: 'short' }),
  }
}

export default function DashboardPage() {
  const { user, token, isLoading } = useAuth()
  const [progress,      setProgress]      = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [events,        setEvents]        = useState<any[]>([])
  const [lastViewed,    setLastViewed]    = useState<any>(null)
  const [loadingData,   setLoadingData]   = useState(true)
  const [swMap,         setSwMap]         = useState<Map<string, any>>(new Map())
  const [portalCourses, setPortalCourses] = useState<any[]>([])
  const [selectedAnn,   setSelectedAnn]   = useState<any>(null)
  const [selectedEv,    setSelectedEv]    = useState<any>(null)

  useEffect(() => {
    if (!token) return
    Promise.all([
      api.progress.getDashboard().catch(() => ({} as any)),
      api.announcements.findPublished().catch(() => [] as any[]),
      api.software.findAll().catch(() => [] as any[]),
      api.courses.findForPortal().catch(() => [] as any[]),
      api.events.findAll().catch(() => [] as any[]),
    ])
      .then(([dashData, anns, softwares, portal, evs]) => {
        setProgress(dashData.courses || [])
        setLastViewed(dashData.lastViewed || null)
        setAnnouncements(Array.isArray(anns) ? anns : [])
        setPortalCourses(Array.isArray(portal) ? portal : [])
        setEvents(Array.isArray(evs) ? evs : [])
        const map = new Map<string, any>()
        if (Array.isArray(softwares)) {
          softwares.forEach((sw: any) => { if (sw?.slug) map.set(sw.slug.toLowerCase(), sw) })
        }
        setSwMap(map)
      })
      .catch(() => {})
      .finally(() => setLoadingData(false))
  }, [token])

  if (isLoading || loadingData) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    )
  }
  if (!user) return null

  const displayName =
    (user as any).firstName ||
    ((user as any).name || '').split(' ')[0] ||
    user.email.split('@')[0]

  const h     = new Date().getHours()
  const greet = h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'

  const now         = new Date()
  const pinnedAnn   = announcements.find((a: any) => a.expiresAt && new Date(a.expiresAt) > now)
  const regularAnns = announcements.filter((a: any) => !pinnedAnn || a.id !== pinnedAnn.id).slice(0, 8)
  const upcomingEvs = events
    .filter((e: any) => new Date(e.date) >= now)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  const inProgress  = progress.filter((c: any) => c.percent > 0 && c.percent < 100)
  const completed   = progress.filter((c: any) => c.percent >= 100)
  const totalDone   = progress.reduce((s: number, c: any) => s + c.completed, 0)
  const inProgIds   = new Set(inProgress.map((c: any) => c.courseId))
  const compIds     = new Set(completed.map((c: any) => c.courseId))
  const disponibili = portalCourses.filter((c: any) => !inProgIds.has(c.id) && !compIds.has(c.id))

  return (
    <div className={styles.page}>

      {/* ── Greeting ────────────────────────────────────────────────────── */}
      <div className={styles.greeting}>
        <div className={styles.greetingInner}>
          <div className={styles.greetingLeft}>
            <p className={styles.greetLabel}>{greet},</p>
            <h1 className={styles.greetName}>{displayName}</h1>
            <p className={styles.greetSub}>
              {inProgress.length > 0
                ? `${inProgress.length} corso${inProgress.length > 1 ? 'i' : ''} in corso — continua a formarti.`
                : progress.length > 0
                  ? 'Ottimo lavoro. Esplora i nuovi corsi disponibili.'
                  : 'Benvenuto in Serviform Academy. Inizia il tuo percorso.'}
            </p>
          </div>

          {lastViewed && (
            <Link href={`/courses/${lastViewed.courseSlug}/${lastViewed.unitSlug}`}
              className={styles.resumePill}>
              <div className={styles.resumePillLabel}>Continua da dove eri</div>
              <div className={styles.resumePillCourse}>{lastViewed.courseTitle}</div>
              <div className={styles.resumePillUnit}>→ {lastViewed.unitTitle}</div>
            </Link>
          )}
        </div>
      </div>

      <div className={styles.body}>

        {/* ── Pinned announcement ─────────────────────────────────────────── */}
        {pinnedAnn && (
          <button
            className={[
              styles.pinnedCard,
              pinnedAnn.bannerUrl ? styles.pinnedCardWithImg : styles.pinnedCardPlain,
            ].join(' ')}
            onClick={() => setSelectedAnn(pinnedAnn)}
          >
            {pinnedAnn.bannerUrl && (
              <div className={styles.pinnedImg}
                style={{ backgroundImage: `url(${pinnedAnn.bannerUrl})` }} />
            )}
            <div className={styles.pinnedBody}>
              <div className={styles.pinnedMeta}>
                <span className={styles.pinnedBadge}>In primo piano</span>
                <span className={styles.pinnedSection}
                  style={{ color: SECTION_COLORS[pinnedAnn.section] || SECTION_COLORS[pinnedAnn.type] || '#888' }}>
                  {SECTION_LABELS[pinnedAnn.section] || SECTION_LABELS[pinnedAnn.type] || pinnedAnn.section}
                </span>
                <span className={styles.pinnedDate}>{formatDate(pinnedAnn.publishedAt || pinnedAnn.createdAt)}</span>
              </div>
              <h2 className={styles.pinnedTitle}>{pinnedAnn.title}</h2>
              {pinnedAnn.body && (
                <p className={styles.pinnedExcerpt}>
                  {pinnedAnn.body.slice(0, 140)}{pinnedAnn.body.length > 140 ? '…' : ''}
                </p>
              )}
              <span className={styles.pinnedCta}>Leggi l&apos;articolo →</span>
            </div>
          </button>
        )}

        {/* ── Stat strip ──────────────────────────────────────────────────── */}
        <div className={styles.statStrip}>
          <Link href="/catalog?status=available" className={styles.statItem}>
            <span className={styles.statValue}>{disponibili.length}</span>
            <span className={styles.statLabel}>disponibili</span>
          </Link>
          <span className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{inProgress.length}</span>
            <span className={styles.statLabel}>in corso</span>
          </div>
          <span className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{completed.length}</span>
            <span className={styles.statLabel}>completati</span>
          </div>
          <span className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{totalDone}</span>
            <span className={styles.statLabel}>unità completate</span>
          </div>
          <Link href="/catalog" className={styles.statCatalogLink}>
            Esplora il catalogo →
          </Link>
        </div>

        {/* ── Main grid: corsi + eventi ────────────────────────────────────── */}
        <div className={[styles.mainGrid, upcomingEvs.length === 0 ? styles.mainGridFull : ''].join(' ')}>

          {/* Corsi */}
          <div className={styles.coursesCol}>
            {inProgress.length > 0 && (
              <>
                <div className={styles.colHeader}>
                  <h2 className={styles.colTitle}>In corso</h2>
                  <Link href="/catalog" className={styles.colLink}>Catalogo →</Link>
                </div>
                <div className={styles.courseList}>
                  {inProgress.map((c: any) => {
                    const brand = getBrand(c.softwareSlug, swMap.get((c.softwareSlug || '').toLowerCase()))
                    return (
                      <Link key={c.courseId || c.courseSlug}
                        href={`/courses/${c.courseSlug}`}
                        className={styles.courseRow}
                        style={{ '--brand-color': brand.color, '--brand-light': brand.light } as any}>
                        <div className={styles.courseRowAccent} style={{ background: brand.color }} />
                        <div className={styles.courseRowBody}>
                          <div className={styles.courseRowTop}>
                            <span className={styles.courseChip}
                              style={{ background: brand.light, color: brand.color }}>
                              {brand.name}
                            </span>
                            <span className={styles.coursePercent}
                              style={{ color: brand.color }}>
                              {c.percent}%
                            </span>
                          </div>
                          <div className={styles.courseRowTitle}>{c.courseTitle}</div>
                          <div className={styles.courseRowFoot}>
                            <div className={styles.courseBar}>
                              <div className={styles.courseBarFill}
                                style={{ width: `${c.percent}%`, background: brand.color }} />
                            </div>
                            <span className={styles.courseUnits}>{c.completed}/{c.total} unità</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </>
            )}

            {completed.length > 0 && (
              <>
                <div className={styles.colHeader} style={{ marginTop: inProgress.length > 0 ? 28 : 0 }}>
                  <h2 className={styles.colTitle}>Completati</h2>
                </div>
                <div className={styles.courseList}>
                  {completed.map((c: any) => {
                    const brand = getBrand(c.softwareSlug, swMap.get((c.softwareSlug || '').toLowerCase()))
                    return (
                      <Link key={c.courseId || c.courseSlug}
                        href={`/courses/${c.courseSlug}`}
                        className={[styles.courseRow, styles.courseRowDone].join(' ')}>
                        <div className={styles.courseRowAccent} style={{ background: '#059669' }} />
                        <div className={styles.courseRowBody}>
                          <div className={styles.courseRowTop}>
                            <span className={styles.courseChip}
                              style={{ background: brand.light, color: brand.color }}>
                              {brand.name}
                            </span>
                            <span className={styles.courseDoneBadge}>✓ Completato</span>
                          </div>
                          <div className={styles.courseRowTitle}>{c.courseTitle}</div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </>
            )}

            {progress.length === 0 && (
              <div className={styles.emptyBlock}>
                <div className={styles.emptyBlockIcon}>
                  <svg viewBox="0 0 24 24" fill="none" width={28} height={28}>
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className={styles.emptyBlockTitle}>Inizia il tuo percorso</h3>
                <p className={styles.emptyBlockDesc}>
                  Hai {disponibili.length} corso{disponibili.length !== 1 ? 'i' : ''} disponibile{disponibili.length !== 1 ? 'i' : 'e'} nel catalogo.
                </p>
                <Link href="/catalog" className={styles.emptyBlockBtn}>Esplora il catalogo →</Link>
              </div>
            )}
          </div>

          {/* Prossimi eventi */}
          {upcomingEvs.length > 0 && (
            <div className={styles.eventsCol}>
              <div className={styles.colHeader}>
                <h2 className={styles.colTitle}>Prossimi eventi</h2>
                <Link href="/newsroom" className={styles.colLink}>Tutti →</Link>
              </div>
              <div className={styles.eventList}>
                {upcomingEvs.map((e: any) => {
                  const { day, month } = formatShortDate(e.date)
                  return (
                    <button key={e.id} className={styles.eventRow} onClick={() => setSelectedEv(e)}>
                      <div className={styles.eventDateChip}>
                        <span className={styles.eventDay}>{day}</span>
                        <span className={styles.eventMonth}>{month}</span>
                      </div>
                      <div className={styles.eventRowBody}>
                        <span className={styles.eventType}>
                          {EV_TYPE_LABELS[e.eventType] || e.eventType}
                        </span>
                        <div className={styles.eventTitle}>{e.title}</div>
                        {e.location && (
                          <div className={styles.eventLocation}>{e.location}</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Comunicazioni recenti ─────────────────────────────────────────── */}
        {regularAnns.length > 0 && (
          <div className={styles.commsSection}>
            <div className={styles.colHeader}>
              <h2 className={styles.colTitle}>Comunicazioni recenti</h2>
              <Link href="/newsroom" className={styles.colLink}>Tutte →</Link>
            </div>
            <div className={styles.commsScroll}>
              {regularAnns.map((a: any) => {
                const color = SECTION_COLORS[a.section] || SECTION_COLORS[a.type] || '#888'
                return (
                  <button key={a.id} className={styles.commCard} onClick={() => setSelectedAnn(a)}>
                    <div className={styles.commCardThumb}>
                      {a.bannerUrl
                        ? <img src={a.bannerUrl} alt="" className={styles.commCardImg} />
                        : <div className={styles.commCardPlaceholder}
                            style={{ background: `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)` }}>
                            <div className={styles.commCardPlaceholderDot} style={{ background: color }} />
                          </div>
                      }
                    </div>
                    <div className={styles.commCardBody}>
                      <div className={styles.commCardTop}>
                        <span className={styles.commCardTag}
                          style={{ background: color + '18', color }}>
                          {SECTION_LABELS[a.section] || SECTION_LABELS[a.type] || a.section}
                        </span>
                        <span className={styles.commCardDate}>
                          {formatDate(a.publishedAt || a.createdAt)}
                        </span>
                      </div>
                      <h4 className={styles.commCardTitle}>{a.title}</h4>
                      {a.body && (
                        <p className={styles.commCardDesc}>
                          {a.body.slice(0, 90)}{a.body.length > 90 ? '…' : ''}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {selectedAnn && <AnnouncementModal item={selectedAnn} onClose={() => setSelectedAnn(null)} />}
      {selectedEv  && <EventModal item={selectedEv}  onClose={() => setSelectedEv(null)} />}
    </div>
  )
}
