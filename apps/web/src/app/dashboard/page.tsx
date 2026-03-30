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

function ProgressRing({ pct }: { pct: number }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const dash = circ * (pct / 100)
  return (
    <svg width={52} height={52} viewBox="0 0 52 52">
      <circle cx={26} cy={26} r={r} fill="none" stroke="var(--border)" strokeWidth={4}/>
      <circle cx={26} cy={26} r={r} fill="none" stroke="var(--red)" strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <text x="50%" y="54%" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink)">{pct}%</text>
    </svg>
  )
}

export default function DashboardPage() {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()
  const [progress, setProgress] = useState<any[]>([])
  const [lastViewed, setLastViewed] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
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

  if (isLoading || loading) {
    return (
      <div className={styles.skeleton}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={styles.skBlock} style={{ animationDelay: `${i * 0.08}s` }}/>
        ))}
      </div>
    )
  }
  if (!user) return null

  const displayName = user.firstName || (user.name || '').split(' ')[0] || user.email.split('@')[0]
  const h = new Date().getHours()
  const greet = h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'

  const started = progress.filter(c => c.completed > 0)
  const completed = progress.filter(c => c.percent >= 100)
  const avgPct = started.length
    ? Math.round(started.reduce((s: number, c: any) => s + c.percent, 0) / started.length)
    : 0
  const totalDone = progress.reduce((s: number, c: any) => s + c.completed, 0)
  const inProgress = started.filter(c => c.percent < 100)

  return (
    <div className={styles.page}>
      {/* ── Hero saluto ─────────────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <p className={styles.greetLabel}>{greet},</p>
            <h1 className={styles.greetName}>{displayName}</h1>
            <p className={styles.greetSub}>
              {inProgress.length > 0
                ? `Hai ${inProgress.length} corso${inProgress.length > 1 ? 'i' : ''} in corso.`
                : progress.length > 0
                  ? 'Ottimo lavoro, continua a formarti.'
                  : 'Benvenuto in Serviform Academy.'}
            </p>
          </div>

          {lastViewed && (
            <Link href={`/courses/${lastViewed.courseSlug}/${lastViewed.unitSlug}`} className={styles.resumeCard}>
              <div className={styles.resumeCardLabel}>Continua da dove eri rimasto</div>
              <div className={styles.resumeCardCourse}>{lastViewed.courseTitle}</div>
              <div className={styles.resumeCardUnit}>→ {lastViewed.unitTitle}</div>
            </Link>
          )}
        </div>
      </div>

      <div className={styles.body}>
        {/* ── KPI ─────────────────────────────────────────────────────── */}
        <div className={styles.kpiRow}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>{progress.length}</div>
            <div className={styles.kpiLabel}>Corsi assegnati</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>{started.length}</div>
            <div className={styles.kpiLabel}>Iniziati</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>{completed.length}</div>
            <div className={styles.kpiLabel}>Completati</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>{totalDone}</div>
            <div className={styles.kpiLabel}>Unità completate</div>
          </div>
          {started.length > 0 && (
            <div className={[styles.kpiCard, styles.kpiCardAccent].join(' ')}>
              <div className={styles.kpiValue}>{avgPct}%</div>
              <div className={styles.kpiLabel}>Avanzamento medio</div>
            </div>
          )}
        </div>

        <div className={styles.grid}>
          {/* ── Colonna sinistra: corsi ──────────────────────────────── */}
          <div className={styles.col}>

            {/* In corso */}
            {inProgress.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>In corso</h2>
                  <Link href="/catalog" className={styles.sectionLink}>Vedi catalogo →</Link>
                </div>
                <div className={styles.courseList}>
                  {inProgress.map((c: any) => {
                    const brand = getBrand(c.softwareSlug || '')
                    return (
                      <Link
                        key={c.courseId || c.courseSlug}
                        href={`/courses/${c.courseSlug}`}
                        className={styles.courseCard}
                      >
                        <div className={styles.courseCardTop}>
                          <span className={styles.courseTag} style={{ background: brand.light, color: brand.color }}>
                            {brand.name}
                          </span>
                          <span className={styles.coursePct}>{c.percent}%</span>
                        </div>
                        <div className={styles.courseTitle}>{c.courseTitle}</div>
                        <div className={styles.courseProgress}>
                          <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{ width: `${c.percent}%` }}/>
                          </div>
                          <span className={styles.progressMeta}>
                            {c.completed} / {c.total} unità
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Completati */}
            {completed.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Completati</h2>
                </div>
                <div className={styles.courseList}>
                  {completed.map((c: any) => {
                    const brand = getBrand(c.softwareSlug || '')
                    return (
                      <Link key={c.courseId || c.courseSlug} href={`/courses/${c.courseSlug}`} className={[styles.courseCard, styles.courseCardDone].join(' ')}>
                        <div className={styles.courseCardTop}>
                          <span className={styles.courseTag} style={{ background: brand.light, color: brand.color }}>{brand.name}</span>
                          <span className={styles.doneBadge}>✓ Completato</span>
                        </div>
                        <div className={styles.courseTitle}>{c.courseTitle}</div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Empty state */}
            {progress.length === 0 && (
              <section className={styles.section}>
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📚</div>
                  <h3 className={styles.emptyTitle}>Nessun corso attivo</h3>
                  <p className={styles.emptyDesc}>
                    Esplora il catalogo e inizia la tua formazione.
                  </p>
                  <Link href="/catalog" className={styles.emptyBtn}>
                    Esplora il catalogo →
                  </Link>
                </div>
              </section>
            )}
          </div>

          {/* ── Colonna destra: comunicazioni ─────────────────────────── */}
          <div className={styles.col}>
            {announcements.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Comunicazioni</h2>
                  <Link href="/communications" className={styles.sectionLink}>Tutte →</Link>
                </div>
                <div className={styles.annList}>
                  {announcements.slice(0, 4).map((a: any) => (
                    <div key={a.id} className={styles.annCard}>
                      <div className={styles.annMeta}>
                        <span
                          className={styles.annType}
                          style={{ background: (TYPE_COLORS[a.type] || '#888') + '15', color: TYPE_COLORS[a.type] || '#888' }}
                        >
                          {TYPE_LABELS[a.type] || a.type}
                        </span>
                        <span className={styles.annDate}>
                          {formatDate(a.publishedAt || a.createdAt)}
                        </span>
                      </div>
                      <div className={styles.annTitle}>{a.title}</div>
                      {a.body && <p className={styles.annBody}>{a.body.slice(0, 140)}{a.body.length > 140 ? '…' : ''}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CTA catalogo */}
            <div className={styles.ctaBox}>
              <div className={styles.ctaTitle}>Esplora il catalogo</div>
              <p className={styles.ctaDesc}>Scopri tutti i corsi disponibili per i software Serviform.</p>
              <Link href="/catalog" className={styles.ctaBtn}>Vai al catalogo →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
