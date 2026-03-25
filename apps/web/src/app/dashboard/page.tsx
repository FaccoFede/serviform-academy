'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getBrand } from '@/lib/brands'
import styles from './DashboardPage.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface CourseProgress {
  courseId: string
  courseTitle: string
  courseSlug: string
  softwareName?: string
  softwareSlug?: string
  softwareColor?: string
  total: number
  completed: number
  percent: number
}

interface LastViewed {
  unitId: string
  unitTitle: string
  unitSlug: string
  courseTitle: string
  courseSlug: string
  softwareName?: string
  softwareSlug?: string
  viewedAt?: string
}

interface Announcement {
  id: string
  title: string
  body: string
  type: string
  publishedAt?: string
}

export default function DashboardPage() {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [lastViewed, setLastViewed] = useState<LastViewed | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
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
      setCourseProgress(prog || [])
      setLastViewed(last)
      setAnnouncements(ann || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [token])

  if (isLoading || loading) return <DashboardSkeleton />
  if (!user) return null

  const started = courseProgress.filter(c => c.completed > 0 || c.percent > 0)
  const overallPercent = started.length === 0 ? 0
    : Math.round(started.reduce((s, c) => s + c.percent, 0) / started.length)
  const totalCompleted = started.reduce((s, c) => s + c.completed, 0)
  const totalUnits = started.reduce((s, c) => s + c.total, 0)
  const displayName = user.firstName || (user.name || '').split(' ')[0] || user.email.split('@')[0]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera'

  return (
    <div className={styles.page}>

      {/* ── Header identità ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.greeting}>{greeting}, {displayName}.</h1>
          {user.company && (
            <p className={styles.company}>
              <svg viewBox="0 0 14 14" fill="none" width={12} height={12}>
                <path d="M1 13V5L7 1l6 4v8H9v-3H5v3H1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              {user.company.name}
            </p>
          )}
        </div>
        <Link href="/catalog" className={styles.exploreBtn}>
          Esplora catalogo
          <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {/* ── Resume card ── */}
      {lastViewed && (
        <div className={styles.resumeWrap}>
          <Link href={`/courses/${lastViewed.courseSlug}/${lastViewed.unitSlug}`} className={styles.resumeCard}>
            <div className={styles.resumeLeft}>
              <span className={styles.resumeEyebrow}>
                <svg viewBox="0 0 14 14" fill="none" width={12} height={12}>
                  <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Continua da dove eri rimasto
              </span>
              <h2 className={styles.resumeUnit}>{lastViewed.unitTitle}</h2>
              <span className={styles.resumeCourse}>
                {lastViewed.courseTitle}
                {lastViewed.softwareName && ` · ${lastViewed.softwareName}`}
              </span>
            </div>
            <div className={styles.resumeArrow}>→</div>
          </Link>
        </div>
      )}

      {/* ── KPI ── */}
      <div className={styles.kpiRow}>
        {[
          { value: `${overallPercent}%`, label: 'avanzamento complessivo', sub: 'sui corsi avviati', isPercent: true, pct: overallPercent },
          { value: started.length, label: 'corsi avviati', sub: 'con almeno una unità vista', isPercent: false, pct: 0 },
          { value: totalCompleted, label: 'unità completate', sub: `su ${totalUnits} totali`, isPercent: false, pct: 0 },
          { value: totalUnits - totalCompleted, label: 'unità rimanenti', sub: 'per completare i corsi attivi', isPercent: false, pct: 0 },
        ].map((k, i) => (
          <div key={i} className={styles.kpiCard}>
            <span className={styles.kpiValue}>{k.value}</span>
            <span className={styles.kpiLabel}>{k.label}</span>
            <span className={styles.kpiSub}>{k.sub}</span>
            {k.isPercent && (
              <div className={styles.kpiBar}>
                <div className={styles.kpiBarFill} style={{ width: `${k.pct}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Corpo principale ── */}
      <div className={styles.body}>

        {/* ── Colonna sinistra: corsi ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>I tuoi corsi</h2>
            <Link href="/catalog" className={styles.sectionLink}>Vai al catalogo →</Link>
          </div>

          {started.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg viewBox="0 0 48 48" fill="none" width={40} height={40}>
                  <rect x="4" y="8" width="40" height="32" rx="4" stroke="var(--border)" strokeWidth="2" />
                  <path d="M16 24h16M24 18v12" stroke="var(--border)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p>Non hai ancora iniziato nessun corso.</p>
              <Link href="/catalog" className={styles.emptyBtn}>Esplora il catalogo</Link>
            </div>
          ) : (
            <div className={styles.courseList}>
              {started.map(c => {
                const brand = getBrand(c.softwareSlug || '')
                const isComplete = c.percent === 100
                return (
                  <Link key={c.courseId} href={`/courses/${c.courseSlug}`} className={styles.courseItem}>
                    <div className={styles.courseItemBar} style={{ background: brand.color }} />
                    <div className={styles.courseItemContent}>
                      <div className={styles.courseItemTop}>
                        <span className={styles.courseItemTag} style={{ background: brand.light, color: brand.color }}>
                          {brand.name}
                        </span>
                        <div className={styles.courseItemRight}>
                          {isComplete && <span className={styles.completeBadge}>✓ Completato</span>}
                          <span className={styles.courseItemPct}>{c.percent}%</span>
                        </div>
                      </div>
                      <h3 className={styles.courseItemTitle}>{c.courseTitle}</h3>
                      <div className={styles.courseItemProgress}>
                        <div className={styles.progressTrack}>
                          <div
                            className={styles.progressFill}
                            style={{
                              width: `${c.percent}%`,
                              background: isComplete ? '#059669' : brand.color,
                            }}
                          />
                        </div>
                        <span className={styles.progressMeta}>{c.completed}/{c.total} unità</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Colonna destra: annunci + azioni rapide ── */}
        <div className={styles.sidebar}>

          {/* Quick actions */}
          <div className={styles.widget}>
            <h3 className={styles.widgetTitle}>Accesso rapido</h3>
            <div className={styles.quickActions}>
              {[
                { href: '/catalog', label: 'Catalogo corsi', icon: '📚' },
                { href: '/profile', label: 'Il mio profilo', icon: '👤' },
                { href: 'https://support.serviform.com', label: 'Assistenza Zendesk', icon: '🎫', external: true },
              ].map(a => (
                a.external
                  ? <a key={a.href} href={a.href} target="_blank" rel="noopener" className={styles.quickAction}>
                      <span>{a.icon}</span>{a.label}
                      <span className={styles.qaArrow}>↗</span>
                    </a>
                  : <Link key={a.href} href={a.href} className={styles.quickAction}>
                      <span>{a.icon}</span>{a.label}
                      <span className={styles.qaArrow}>→</span>
                    </Link>
              ))}
            </div>
          </div>

          {/* Annunci */}
          {announcements.length > 0 && (
            <div className={styles.widget}>
              <h3 className={styles.widgetTitle}>Novità</h3>
              <div className={styles.announcementList}>
                {announcements.slice(0, 5).map(a => (
                  <div key={a.id} className={styles.announcement}>
                    <div className={styles.annDot} data-type={a.type} />
                    <div className={styles.annContent}>
                      <h4 className={styles.annTitle}>{a.title}</h4>
                      <p className={styles.annBody}>{a.body}</p>
                      {a.publishedAt && (
                        <span className={styles.annDate}>
                          {new Date(a.publishedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.skeletonLine} style={{ width: 240, height: 36, marginBottom: 8 }} />
          <div className={styles.skeletonLine} style={{ width: 140, height: 16 }} />
        </div>
      </div>
      <div className={styles.kpiRow}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={styles.kpiCard}>
            <div className={styles.skeletonLine} style={{ width: 60, height: 32, marginBottom: 8 }} />
            <div className={styles.skeletonLine} style={{ width: 100, height: 12 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
