'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getBrand } from '@/lib/brands'
import styles from './DashboardPage.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const TYPE_LABELS: Record<string, string> = {
  NEWS: 'Novità', NEW_COURSE: 'Nuovo corso', WEBINAR: 'Webinar', MAINTENANCE: 'Manutenzione',
}
const TYPE_COLORS: Record<string, string> = {
  NEWS: '#067DB8', NEW_COURSE: '#E63329', WEBINAR: '#059669', MAINTENANCE: '#D97706',
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DashboardPage() {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()
  const [progress, setProgress] = useState<any[]>([])
  const [lastViewed, setLastViewed] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [annFilter, setAnnFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login')
  }, [isLoading, user, router])

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
    <div className={styles.skeleton}>
      {[1,2,3].map(i => <div key={i} className={styles.skBlock} style={{animationDelay: `${i*0.1}s`}}/>)}
    </div>
  )
  if (!user) return null

  const name = user.firstName || (user.name || '').split(' ')[0] || user.email.split('@')[0]
  const h = new Date().getHours()
  const greet = h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'
  const dateStr = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  const started = progress.filter(c => c.completed > 0)
  const avgPct = started.length ? Math.round(started.reduce((s, c) => s + c.percent, 0) / started.length) : 0
  const totalDone = progress.reduce((s, c) => s + c.completed, 0)

  const filteredAnn = annFilter === 'ALL'
    ? announcements
    : announcements.filter(a => a.type === annFilter)

  const annTypes = ['ALL', ...Array.from(new Set(announcements.map(a => a.type)))] as string[]

  return (
    <div className={styles.page}>

      {/* ── NEWSROOM HERO ─────────────────────────────── */}
      <div className={styles.newsroomHero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroTag}>communication · {dateStr}</div>
          <h1 className={styles.heroTitle}>
            {greet}, {name}.<br/>
            <span>In evidenza oggi</span>
          </h1>
          <p className={styles.heroDesc}>Controlla le comunicazioni per restare aggiornato sulle novità</p>
        </div>
        {user.company && (
          <div className={styles.heroRight}>
            <div className={styles.companyBadge}>
              <svg viewBox="0 0 16 16" fill="none" width={14} height={14}><rect x="2" y="7" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {user.company.name}
            </div>
          </div>
        )}
      </div>

      {/* ── KPI STRIP ─────────────────────────────────── */}
      <div className={styles.kpiStrip}>
        {[
          { icon: '📊', v: `${avgPct}%`, l: 'Avanzamento medio', accent: avgPct > 0 },
          { icon: '📚', v: started.length, l: 'Corsi avviati', accent: false },
          { icon: '✓', v: totalDone, l: 'Unità completate', accent: false },
          { icon: '🔔', v: announcements.length, l: 'Comunicazioni', accent: announcements.length > 0 },
        ].map((k, i) => (
          <div key={i} className={[styles.kpiCard, k.accent ? styles.kpiCardAccent : ''].join(' ')}>
            <span className={styles.kpiIcon}>{k.icon}</span>
            <span className={styles.kpiVal}>{k.v}</span>
            <span className={styles.kpiLabel}>{k.l}</span>
          </div>
        ))}
      </div>

      {/* ── MAIN LAYOUT ───────────────────────────────── */}
      <div className={styles.main}>

        {/* BACHECA ANNUNCI — cuore della dashboard */}
        <section className={styles.newsSection}>
          <div className={styles.newsSectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Comunicazioni e novità
              </h2>
              <p className={styles.sectionSub}>Notizie, nuovi corsi e aggiornamenti dalla piattaforma</p>
            </div>
            <Link href="/communications" className={styles.seeAllBtn}>Vedi tutte →</Link>
          </div>

          {/* Filtri tipo */}
          {annTypes.length > 1 && (
            <div className={styles.annFilters}>
              {annTypes.map(t => (
                <button
                  key={t}
                  className={[styles.annFilterBtn, annFilter === t ? styles.annFilterActive : ''].join(' ')}
                  onClick={() => setAnnFilter(t)}
                  style={annFilter === t && t !== 'ALL' ? { background: TYPE_COLORS[t] + '18', color: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] + '55' } : {}}
                >
                  {t === 'ALL' ? 'Tutti' : TYPE_LABELS[t] || t}
                </button>
              ))}
            </div>
          )}

          {filteredAnn.length === 0 ? (
            <div className={styles.annEmpty}>
              <svg viewBox="0 0 48 48" fill="none" width={36} height={36}>
                <rect x="8" y="6" width="32" height="36" rx="3" stroke="var(--border)" strokeWidth="2"/>
                <path d="M16 16h16M16 22h16M16 28h10" stroke="var(--border)" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="34" cy="34" r="8" fill="var(--surface)" stroke="var(--border)" strokeWidth="2"/>
                <path d="M31 34h6M34 31v6" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p>Nessuna comunicazione disponibile.</p>
            </div>
          ) : (
            <div className={styles.annGrid}>
              {filteredAnn.map((a, idx) => {
                const color = TYPE_COLORS[a.type] || 'var(--muted)'
                const isPinned = idx === 0 && a.type === 'NEW_COURSE'
                return (
                  <article key={a.id} className={[styles.annCard, isPinned ? styles.annCardPinned : ''].join(' ')}>
                    <div className={styles.annCardAccent} style={{ background: color }}/>
                    <div className={styles.annCardBody}>
                      <div className={styles.annCardTop}>
                        <span className={styles.annType} style={{ color, background: color + '14' }}>
                          {TYPE_LABELS[a.type] || a.type}
                        </span>
                        {isPinned && (
                          <span className={styles.pinBadge}>
                            <svg viewBox="0 0 12 12" fill="none" width={9} height={9}><path d="M6 1v6M4 10h4M8 4l1-3M4 4l-1-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                            In primo piano
                          </span>
                        )}
                      </div>
                      <h3 className={styles.annTitle}>{a.title}</h3>
                      <p className={styles.annBody}>{a.body}</p>
                      <div className={styles.annFooter}>
                        {a.publishedAt && (
                          <span className={styles.annDate}>
                            <svg viewBox="0 0 12 12" fill="none" width={10} height={10}><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1"/><path d="M6 4v2l1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                            {formatDate(a.publishedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* SIDEBAR */}
        <aside className={styles.sidebar}>

          {/* Resume card */}
          {lastViewed && (
            <Link href={`/courses/${lastViewed.courseSlug}/${lastViewed.unitSlug}`} className={styles.resumeCard}>
              <div className={styles.resumeLabel}>
                <svg viewBox="0 0 12 12" fill="none" width={10} height={10}><path d="M3 2l6 4-6 4V2z" fill="currentColor"/></svg>
                Continua
              </div>
              <div className={styles.resumeTitle}>{lastViewed.unitTitle}</div>
              <div className={styles.resumeSub}>{lastViewed.courseTitle}</div>
              <div className={styles.resumeArrow}>→</div>
            </Link>
          )}

          {/* Corsi in corso */}
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <span className={styles.widgetTitle}>I tuoi corsi</span>
              <Link href="/catalog" className={styles.widgetLink}>Esplora</Link>
            </div>
            {progress.length === 0 ? (
              <div className={styles.widgetEmpty}>
                <p>Nessun corso iniziato.</p>
                <Link href="/catalog" className={styles.widgetEmptyBtn}>Esplora catalogo →</Link>
              </div>
            ) : (
              <div className={styles.courseList}>
                {progress.slice(0, 4).map(c => {
                  const brand = getBrand(c.softwareSlug || '')
                  const done = c.percent === 100
                  return (
                    <Link key={c.courseId} href={`/courses/${c.courseSlug}`} className={styles.courseRow}>
                      <div className={styles.courseRowBar} style={{ background: done ? '#059669' : brand.color }}/>
                      <div className={styles.courseRowBody}>
                        <div className={styles.courseRowName}>{c.courseTitle}</div>
                        <div className={styles.courseRowMeta}>
                          <div className={styles.courseRowTrack}>
                            <div className={styles.courseRowFill} style={{ width: `${c.percent}%`, background: done ? '#059669' : brand.color }}/>
                          </div>
                          <span>{c.percent}%</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <span className={styles.widgetTitle}>Accesso rapido</span>
            </div>
            {[
              { href: '/catalog', label: 'Catalogo corsi', icon: '📚' },
              { href: '/newsroom', label: 'Newsroom', icon: '📰' },
              ...(user.role === 'ADMIN' || user.role === 'TEAM_ADMIN'
                ? [{ href: '/admin', label: 'Pannello admin', icon: '⚙️' }]
                : []),
              { href: 'https://support.serviform.com', label: 'Assistenza', icon: '❓', ext: true },
            ].map((item: any) => (
              item.ext
                ? <a key={item.href} href={item.href} target="_blank" rel="noopener" className={styles.quickLink}>
                    <span>{item.icon}</span>{item.label}<span className={styles.quickArrow}>↗</span>
                  </a>
                : <Link key={item.href} href={item.href} className={styles.quickLink}>
                    <span>{item.icon}</span>{item.label}<span className={styles.quickArrow}>→</span>
                  </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
