'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getBrand } from '@/lib/brands'
import styles from './DashboardPage.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function SvgIcon({ path, size = 16 }: { path: string; size?: number }) {
  return <svg viewBox="0 0 24 24" fill="none" width={size} height={size} style={{flexShrink:0}}><path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

const SECTION_COLORS: Record<string, string> = {
  NEWS: '#067DB8', EVENTS: '#059669', NEW_COURSE: '#E63329', WEBINAR: '#059669', MAINTENANCE: '#D97706',
}

export default function DashboardPage() {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()
  const [progress, setProgress] = useState<any[]>([])
  const [lastViewed, setLastViewed] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (!isLoading && !user) router.push('/auth/login') }, [isLoading, user, router])

  useEffect(() => {
    if (!token) return
    const h = { Authorization: 'Bearer ' + token }
    Promise.all([
      fetch(API_URL + '/progress/all', { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(API_URL + '/progress/last-viewed', { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(API_URL + '/announcements', { headers: h }).then(r => r.ok ? r.json() : []),
    ]).then(([prog, last, ann]) => {
      setProgress(prog || [])
      setLastViewed(last)
      setAnnouncements(ann || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [token])

  if (isLoading || loading) return (
    <div className={styles.skeleton}>{[1,2,3].map(i => <div key={i} className={styles.skBlock}/>)}</div>
  )
  if (!user) return null

  const name = user.firstName || (user.name || '').split(' ')[0] || user.email.split('@')[0]
  const h = new Date().getHours()
  const greet = h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'
  const started = progress.filter(c => c.completed > 0)
  const avgPct = started.length ? Math.round(started.reduce((s, c) => s + c.percent, 0) / started.length) : 0
  const totalDone = progress.reduce((s, c) => s + c.completed, 0)
  const totalUnits = progress.reduce((s, c) => s + c.total, 0)

  return (
    <div className={styles.page}>

      {/* Barra nera superiore */}
      <div className={styles.topStrip}>
        <div className={styles.topStripInner}>
          <div className={styles.topStripLeft}>
            <h1 className={styles.greeting}>{greet}, <span>{name}</span></h1>
            {user.company && <span className={styles.companyTag}><SvgIcon path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" size={12}/>{user.company.name}</span>}
          </div>
          <div className={styles.topStripRight}>
            <div className={styles.topStat}><span className={styles.topStatN}>{avgPct}%</span><span className={styles.topStatL}>avanzamento</span></div>
            <div className={styles.topStatDivider}/>
            <div className={styles.topStat}><span className={styles.topStatN}>{started.length}</span><span className={styles.topStatL}>corsi avviati</span></div>
            <div className={styles.topStatDivider}/>
            <div className={styles.topStat}><span className={styles.topStatN}>{totalDone}/{totalUnits}</span><span className={styles.topStatL}>unità</span></div>
          </div>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className={styles.mainLayout}>

        {/* COLONNA CORSI (priorità) */}
        <main className={styles.mainCol}>

          {/* Resume card */}
          {lastViewed && (
            <Link href={`/courses/${lastViewed.courseSlug}/${lastViewed.unitSlug}`} className={styles.resumeCard}>
              <div className={styles.resumePlay}>
                <SvgIcon path="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" size={14}/>
                <SvgIcon path="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={14}/>
              </div>
              <div className={styles.resumeText}>
                <span className={styles.resumeLabel}>Continua da dove eri rimasto</span>
                <span className={styles.resumeTitle}>{lastViewed.unitTitle}</span>
                <span className={styles.resumeCourse}>{lastViewed.courseTitle}{lastViewed.softwareName && ` · ${lastViewed.softwareName}`}</span>
              </div>
              <SvgIcon path="M13 7l5 5m0 0l-5 5m5-5H6" size={18}/>
            </Link>
          )}

          {/* Corsi in corso */}
          <section className={styles.section}>
            <div className={styles.sectionHdr}>
              <h2 className={styles.sectionTitle}>
                <SvgIcon path="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" size={16}/>
                I tuoi corsi
              </h2>
              <Link href="/catalog" className={styles.sectionCta}>Esplora catalogo →</Link>
            </div>

            {progress.length === 0 ? (
              <div className={styles.emptyState}>
                <SvgIcon path="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" size={32}/>
                <p>Non hai ancora iniziato nessun corso.</p>
                <Link href="/catalog" className={styles.emptyBtn}>Esplora il catalogo</Link>
              </div>
            ) : (
              <div className={styles.courseGrid}>
                {progress.map(c => {
                  const brand = getBrand(c.softwareSlug || '')
                  const done = c.percent === 100
                  return (
                    <Link key={c.courseId} href={`/courses/${c.courseSlug}`} className={styles.courseCard}>
                      <div className={styles.courseCardTop}>
                        <span className={styles.courseBrand} style={{ background: brand.light, color: brand.color }}>{brand.name}</span>
                        <span className={styles.coursePct} style={{ color: done ? '#059669' : 'var(--muted)' }}>
                          {done ? '✓' : `${c.percent}%`}
                        </span>
                      </div>
                      <div className={styles.courseName}>{c.courseTitle}</div>
                      <div className={styles.courseBar}>
                        <div className={styles.courseBarFill} style={{ width: `${c.percent}%`, background: done ? '#059669' : brand.color }}/>
                      </div>
                      <div className={styles.courseMeta}>{c.completed}/{c.total} unità</div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {/* Quick links */}
          <div className={styles.quickGrid}>
            {[
              { href: '/catalog', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Catalogo corsi' },
              ...(user.role === 'ADMIN' || user.role === 'TEAM_ADMIN' ? [{ href: '/admin', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', label: 'Pannello admin' }] : []),
              { href: 'https://support.serviform.com', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Assistenza', ext: true },
            ].map((q: any) => (
              q.ext
                ? <a key={q.href} href={q.href} target="_blank" rel="noopener" className={styles.quickCard}>
                    <SvgIcon path={q.icon} size={18}/>{q.label}<SvgIcon path="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" size={12}/>
                  </a>
                : <Link key={q.href} href={q.href} className={styles.quickCard}>
                    <SvgIcon path={q.icon} size={18}/>{q.label}<SvgIcon path="M9 5l7 7-7 7" size={12}/>
                  </Link>
            ))}
          </div>
        </main>

        {/* SIDEBAR COMUNICAZIONI (secondaria) */}
        <aside className={styles.sidebar}>
          <div className={styles.annWidget}>
            <div className={styles.annWidgetHeader}>
              <div className={styles.annWidgetTitle}>
                <SvgIcon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" size={14}/>
                Comunicazione &amp; Eventi
              </div>
              <Link href="/communications-events" className={styles.annWidgetLink}>Vedi tutto</Link>
            </div>

            {announcements.length === 0 ? (
              <div className={styles.annEmpty}>
                <SvgIcon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" size={28}/>
                <p>Nessuna comunicazione</p>
              </div>
            ) : (
              <div className={styles.annList}>
                {announcements.slice(0, 5).map(a => {
                  const color = SECTION_COLORS[a.type] || 'var(--muted)'
                  return (
                    <Link key={a.id} href="/communications-events" className={styles.annItem}>
                      {a.isPinned && <div className={styles.annPinDot}/>}
                      <div className={styles.annItemAccent} style={{ background: color }}/>
                      <div className={styles.annItemBody}>
                        <span className={styles.annItemType} style={{ color }}>
                          {a.type === 'NEW_COURSE' ? 'Nuovo corso' : a.type === 'WEBINAR' ? 'Webinar' : a.type === 'MAINTENANCE' ? 'Manutenzione' : 'Novità'}
                        </span>
                        <span className={styles.annItemTitle}>{a.title}</span>
                      </div>
                      <SvgIcon path="M9 5l7 7-7 7" size={11}/>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
