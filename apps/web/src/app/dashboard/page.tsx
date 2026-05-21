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

const STAT_CONFIGS = [
  { key: 'disponibili', label: 'Disponibili',       accent: '#0EA5E9', href: '/catalog' },
  { key: 'inCorso',     label: 'In corso',           accent: '#F59E0B', href: null },
  { key: 'completati',  label: 'Completati',         accent: '#10B981', href: null },
  { key: 'unitaDone',   label: 'Unità completate',   accent: '#E63329', href: null },
]

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
  const upcomingEvs = events
    .filter((e: any) => new Date(e.date) >= now)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6)

  const inProgress  = progress.filter((c: any) => c.percent > 0 && c.percent < 100)
  const completed   = progress.filter((c: any) => c.percent >= 100)
  const totalDone   = progress.reduce((s: number, c: any) => s + c.completed, 0)
  const inProgIds   = new Set(inProgress.map((c: any) => c.courseId))
  const compIds     = new Set(completed.map((c: any) => c.courseId))
  const disponibili = portalCourses.filter((c: any) => !inProgIds.has(c.id) && !compIds.has(c.id))

  const statValues: Record<string, number> = {
    disponibili: disponibili.length,
    inCorso:     inProgress.length,
    completati:  completed.length,
    unitaDone:   totalDone,
  }

  return (
    <div className={styles.page}>

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className={styles.greeting}>
        <div className={styles.greetingInner}>
          <div className={styles.greetingLeft}>
            <p className={styles.greetLabel}>{greet},</p>
            <h1 className={styles.greetName}>{displayName}</h1>
            <p className={styles.greetSub}>
              {inProgress.length > 0
                ? `Hai ${inProgress.length} corso${inProgress.length > 1 ? 'i' : ''} in corso — continua a formarti.`
                : progress.length > 0
                  ? 'Ottimo lavoro. Esplora i nuovi corsi disponibili.'
                  : 'Benvenuto in Serviform Academy. Inizia il tuo percorso.'}
            </p>
          </div>

          {lastViewed && (
            <Link href={`/courses/${lastViewed.courseSlug}/${lastViewed.unitSlug}`}
              className={styles.resumePill}>
              <span className={styles.resumePillEyebrow}>▶ Continua da dove eri</span>
              <span className={styles.resumePillCourse}>{lastViewed.courseTitle}</span>
              <span className={styles.resumePillUnit}>{lastViewed.unitTitle}</span>
            </Link>
          )}
        </div>
      </div>

      <div className={styles.body}>

        {/* ── Statistiche ─────────────────────────────────────────────────── */}
        <div className={styles.statRow}>
          {STAT_CONFIGS.map((cfg) => {
            const value = statValues[cfg.key]
            const inner = (
              <>
                <span className={styles.statValue} style={{ color: cfg.accent }}>{value}</span>
                <span className={styles.statLabel}>{cfg.label}</span>
              </>
            )
            return cfg.href
              ? <Link key={cfg.key} href={cfg.href}
                  className={[styles.statCard, styles.statCardLink].join(' ')}
                  style={{ '--accent': cfg.accent } as any}>{inner}</Link>
              : <div key={cfg.key} className={styles.statCard}
                  style={{ '--accent': cfg.accent } as any}>{inner}</div>
          })}
        </div>

        {/* ── Corsi in corso ───────────────────────────────────────────────── */}
        {inProgress.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>In corso</h2>
              <Link href="/catalog" className={styles.sectionLink}>Esplora il catalogo →</Link>
            </div>
            <div className={styles.courseGrid}>
              {inProgress.map((c: any) => {
                const brand = getBrand(c.softwareSlug, swMap.get((c.softwareSlug || '').toLowerCase()))
                return (
                  <Link key={c.courseId || c.courseSlug}
                    href={`/courses/${c.courseSlug}`}
                    className={styles.courseCard}
                    style={{ '--shadow-clr': brand.color + '28' } as any}>
                    <div className={styles.courseCardBand}
                      style={{ background: `linear-gradient(135deg, ${brand.color} 0%, ${brand.color}bb 100%)` }}>
                      <span className={styles.courseCardBrandName}>{brand.name}</span>
                      <span className={styles.courseCardPct}>{c.percent}%</span>
                    </div>
                    <div className={styles.courseCardBody}>
                      <div className={styles.courseCardTitle}>{c.courseTitle}</div>
                      <div className={styles.courseCardFoot}>
                        <div className={styles.progressTrack}>
                          <div className={styles.progressFill}
                            style={{ width: `${c.percent}%`, background: brand.color }} />
                        </div>
                        <span className={styles.courseUnits}>{c.completed}/{c.total}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Corsi completati ─────────────────────────────────────────────── */}
        {completed.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Completati</h2>
            </div>
            <div className={styles.courseGrid}>
              {completed.map((c: any) => {
                const brand = getBrand(c.softwareSlug, swMap.get((c.softwareSlug || '').toLowerCase()))
                return (
                  <Link key={c.courseId || c.courseSlug}
                    href={`/courses/${c.courseSlug}`}
                    className={[styles.courseCard, styles.courseCardDone].join(' ')}
                    style={{ '--shadow-clr': '#10B98128' } as any}>
                    <div className={styles.courseCardBand}
                      style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669bb 100%)' }}>
                      <span className={styles.courseCardBrandName}>{brand.name}</span>
                      <span className={styles.courseCardDoneMark}>✓ Completato</span>
                    </div>
                    <div className={styles.courseCardBody}>
                      <div className={styles.courseCardTitle}>{c.courseTitle}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {progress.length === 0 && (
          <div className={styles.emptyBlock}>
            <div className={styles.emptyBlockIcon}>
              <svg viewBox="0 0 32 32" fill="none" width={36} height={36}>
                <path d="M16 3L3 10l13 7 13-7-13-7zM3 22l13 7 13-7M3 16l13 7 13-7"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className={styles.emptyBlockTitle}>Inizia il tuo percorso</h3>
            <p className={styles.emptyBlockDesc}>
              {disponibili.length} corso{disponibili.length !== 1 ? 'i' : ''} disponibile{disponibili.length !== 1 ? 'i' : 'e'} nel catalogo.
            </p>
            <Link href="/catalog" className={styles.emptyBlockBtn}>Esplora il catalogo →</Link>
          </div>
        )}

        {/* ── Riga eventi + comunicazioni ─────────────────────────────────── */}
        {(upcomingEvs.length > 0 || announcements.length > 0) && (
          <div className={styles.evCommRow}>

            {upcomingEvs.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>Prossimi eventi</h2>
                  <Link href="/newsroom" className={styles.sectionLink}>Tutti →</Link>
                </div>
                <div className={styles.bannerGrid}>
                  {upcomingEvs.map((e: any) => {
                    const { day, month } = formatShortDate(e.date)
                    const color = SECTION_COLORS[e.eventType] || '#059669'
                    return (
                      <button key={e.id} className={styles.bannerCard} onClick={() => setSelectedEv(e)}>
                        <div className={styles.bannerThumb}
                          style={e.bannerUrl
                            ? { backgroundImage: `url(${e.bannerUrl})` }
                            : { background: `linear-gradient(135deg, ${color}28 0%, ${color}0e 100%)` }
                          }>
                          <div className={styles.dateBadge}>
                            <span className={styles.dateDay}>{day}</span>
                            <span className={styles.dateMonth}>{month}</span>
                          </div>
                          {!e.bannerUrl && (
                            <div className={styles.bannerEmptyIcon} style={{ color }}>
                              <svg viewBox="0 0 40 40" fill="none" width={36} height={36}>
                                <path d="M12 8h16l8 8v16H4V8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                                <circle cx="20" cy="22" r="5" stroke="currentColor" strokeWidth="1.4"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className={styles.bannerBody}>
                          <span className={styles.bannerTag} style={{ background: color + '18', color }}>
                            {EV_TYPE_LABELS[e.eventType] || e.eventType}
                          </span>
                          <div className={styles.bannerTitle}>{e.title}</div>
                          {e.location && <div className={styles.bannerSub}>{e.location}</div>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {announcements.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>Comunicazioni recenti</h2>
                  <Link href="/newsroom" className={styles.sectionLink}>Tutte →</Link>
                </div>
                <div className={styles.bannerGrid}>
                  {announcements.slice(0, 6).map((a: any) => {
                    const color = SECTION_COLORS[a.section] || SECTION_COLORS[a.type] || '#888'
                    return (
                      <button key={a.id} className={styles.bannerCard} onClick={() => setSelectedAnn(a)}>
                        <div className={styles.bannerThumb}
                          style={a.bannerUrl
                            ? { backgroundImage: `url(${a.bannerUrl})` }
                            : { background: `linear-gradient(135deg, ${color}28 0%, ${color}0e 100%)` }
                          }>
                          {!a.bannerUrl && (
                            <div className={styles.bannerEmptyIcon} style={{ color }}>
                              <svg viewBox="0 0 40 40" fill="none" width={36} height={36}>
                                <path d="M6 10h28v22H6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                                <path d="M6 15l14 8 14-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className={styles.bannerBody}>
                          <div className={styles.bannerMeta}>
                            <span className={styles.bannerTag} style={{ background: color + '18', color }}>
                              {SECTION_LABELS[a.section] || SECTION_LABELS[a.type] || a.section}
                            </span>
                            <span className={styles.bannerDate}>{formatDate(a.publishedAt || a.createdAt)}</span>
                          </div>
                          <div className={styles.bannerTitle}>{a.title}</div>
                          {a.body && (
                            <p className={styles.bannerDesc}>
                              {a.body.slice(0, 80)}{a.body.length > 80 ? '…' : ''}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

          </div>
        )}

      </div>

      {selectedAnn && <AnnouncementModal item={selectedAnn} onClose={() => setSelectedAnn(null)} />}
      {selectedEv  && <EventModal item={selectedEv}  onClose={() => setSelectedEv(null)} />}
    </div>
  )
}
