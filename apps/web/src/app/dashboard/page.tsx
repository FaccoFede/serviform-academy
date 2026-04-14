'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import AnnouncementModal from '@/components/ui/AnnouncementModal'
import { getBrand } from '@/lib/brands'
import styles from './DashboardPage.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const TYPE_LABELS: Record<string, string> = {
  NEWS: 'Novità', NEW_COURSE: 'Nuovo corso', WEBINAR: 'Webinar',
  MAINTENANCE: 'Manutenzione', EVENTS: 'Evento', PRESS: 'Comunicato', RULES: 'Regola',
}
const TYPE_COLORS: Record<string, string> = {
  NEWS: '#067DB8', NEW_COURSE: '#E63329', WEBINAR: '#059669',
  MAINTENANCE: '#D97706', EVENTS: '#059669', PRESS: '#7C3AED', RULES: '#D97706',
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Progress circle — STEP 3 ──────────────────────────────────────────────
function ProgressCircle({ percent }: { percent: number }) {
  const r      = 18
  const circ   = 2 * Math.PI * r
  const capped = Math.min(Math.max(percent, 0), 100)
  const offset = circ - (capped / 100) * circ
  const color  = capped >= 100 ? '#059669' : 'var(--red, #E63329)'
  return (
    <svg width={44} height={44} viewBox="0 0 44 44" style={{ flexShrink: 0 }}
      aria-label={`${capped}% completato`}>
      <circle cx="22" cy="22" r={r} fill="none"
        stroke="var(--border, #e5e5e0)" strokeWidth="3"/>
      <circle cx="22" cy="22" r={r} fill="none"
        stroke={color} strokeWidth="3"
        strokeDasharray={`${circ}`} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 22 22)"
        style={{ transition: 'stroke-dashoffset 600ms ease' }}/>
      <text x="22" y="26" textAnchor="middle" fontSize="10" fontWeight="700"
        fill={color} fontFamily="var(--font-mono, monospace)">
        {capped}%
      </text>
    </svg>
  )
}

export default function DashboardPage() {
  const { user, token, isLoading } = useAuth()
  const [progress,      setProgress]      = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [lastViewed,    setLastViewed]    = useState<any>(null)
  const [loadingData,   setLoadingData]   = useState(true)
  const [swMap,         setSwMap]         = useState<Map<string, any>>(new Map())
  const [portalCourses, setPortalCourses] = useState<any[]>([])
  // STEP 4: apre AnnouncementModal direttamente al click
  const [selectedAnn,   setSelectedAnn]   = useState<any>(null)

  useEffect(() => {
    if (!token) return
    const headers: any = { Authorization: 'Bearer ' + token }
    Promise.all([
      fetch(`${API_URL}/progress/dashboard`, { headers, cache: 'no-store' })
        .then(r => r.ok ? r.json() : {}),
      fetch(`${API_URL}/announcements`, { headers })
        .then(r => r.ok ? r.json() : []),
      // Fetch software list (senza auth) per avere name/color/tagline dal DB
      fetch(`${API_URL}/software`)
        .then(r => r.ok ? r.json() : []),
      // Corsi visibili per l'utente secondo le preferenze aziendali
      fetch(`${API_URL}/courses/portal`, { headers, cache: 'no-store' })
        .then(r => r.ok ? r.json() : []),
    ])
      .then(([dashData, anns, softwares, portal]) => {
        setProgress(dashData.courses || [])
        setLastViewed(dashData.lastViewed || null)
        setAnnouncements(Array.isArray(anns) ? anns : [])
        setPortalCourses(Array.isArray(portal) ? portal : [])
        // Mappa slug (normalizzato in lowercase) → oggetto software DB
        const map = new Map<string, any>()
        if (Array.isArray(softwares)) {
          softwares.forEach((sw: any) => {
            if (sw?.slug) map.set(sw.slug.toLowerCase(), sw)
          })
        }
        setSwMap(map)
      })
      .catch(() => {})
      .finally(() => setLoadingData(false))
  }, [token])

  if (isLoading || loadingData) {
    return (
      <div style={{ padding: 80, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
        Caricamento…
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

  const inProgress  = progress.filter((c: any) => c.percent > 0 && c.percent < 100)
  const completed   = progress.filter((c: any) => c.percent >= 100)
  const avgPct      = inProgress.length
    ? Math.round(inProgress.reduce((s: number, c: any) => s + c.percent, 0) / inProgress.length) : 0
  const totalDone   = progress.reduce((s: number, c: any) => s + c.completed, 0)
  const inProgIds   = new Set(inProgress.map((c: any) => c.courseId))
  const compIds     = new Set(completed.map((c: any) => c.courseId))
  const disponibili = portalCourses.filter((c: any) => !inProgIds.has(c.id) && !compIds.has(c.id))

  return (
    <div className={styles.page}>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <p className={styles.greetLabel}>{greet},</p>
            <h1 className={styles.greetName}>{displayName}</h1>
            <p className={styles.greetSub}>
              {inProgress.length > 0
                ? `Hai ${inProgress.length} corso${inProgress.length > 1 ? 'i' : ''} in corso.`
                : progress.length > 0 ? 'Ottimo lavoro, continua a formarti.'
                : 'Benvenuto in Serviform Academy.'}
            </p>
          </div>
          {lastViewed && (
            <Link href={`/courses/${lastViewed.courseSlug}/${lastViewed.unitSlug}`}
              className={styles.resumeCard}>
              <div className={styles.resumeCardLabel}>Continua da dove eri rimasto</div>
              <div className={styles.resumeCardCourse}>{lastViewed.courseTitle}</div>
              <div className={styles.resumeCardUnit}>→ {lastViewed.unitTitle}</div>
            </Link>
          )}
        </div>
      </div>

      <div className={styles.body}>
        {/* KPI */}
        <div className={styles.kpiRow}>
          <Link href="/catalog?status=available"
            className={[styles.kpiCard, styles.kpiCardLink].join(' ')}>
            <div className={styles.kpiValue}>{disponibili.length}</div>
            <div className={styles.kpiLabel}>Disponibili</div>
          </Link>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>{inProgress.length}</div>
            <div className={styles.kpiLabel}>In corso</div>
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
          {/* Colonna sinistra */}
          <div className={styles.col}>
            {inProgress.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>In corso</h2>
                  <Link href="/catalog" className={styles.sectionLink}>Vedi catalogo →</Link>
                </div>
                <div className={styles.courseList}>
                  {inProgress.map((c: any) => {
                    const brand = getBrand(c.softwareSlug, swMap.get((c.softwareSlug || '').toLowerCase()))
                    return (
                      <Link key={c.courseId || c.courseSlug}
                        href={`/courses/${c.courseSlug}`} className={styles.courseCard}>
                        <div className={styles.courseCardTop}>
                          <span className={styles.courseTag}
                            style={{ background: brand.light, color: brand.color }}>
                            {brand.name}
                          </span>
                          {/* STEP 3: ProgressCircle al posto del testo % */}
                          <ProgressCircle percent={c.percent} />
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

            {completed.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Completati</h2>
                </div>
                <div className={styles.courseList}>
                  {completed.map((c: any) => {
                    const brand = getBrand(c.softwareSlug, swMap.get((c.softwareSlug || '').toLowerCase()))
                    return (
                      <Link key={c.courseId || c.courseSlug}
                        href={`/courses/${c.courseSlug}`}
                        className={[styles.courseCard, styles.courseCardDone].join(' ')}>
                        <div className={styles.courseCardTop}>
                          <span className={styles.courseTag}
                            style={{ background: brand.light, color: brand.color }}>
                            {brand.name}
                          </span>
                          {/* STEP 3: ProgressCircle al posto di "✓ Completato" */}
                          <ProgressCircle percent={100} />
                        </div>
                        <div className={styles.courseTitle}>{c.courseTitle}</div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {progress.length === 0 && (
              <section className={styles.section}>
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📚</div>
                  <h3 className={styles.emptyTitle}>Nessun corso attivo</h3>
                  <p className={styles.emptyDesc}>Esplora il catalogo e inizia la tua formazione.</p>
                  <Link href="/catalog" className={styles.emptyBtn}>Esplora il catalogo →</Link>
                </div>
              </section>
            )}
          </div>

          {/* Colonna destra: comunicazioni */}
          <div className={styles.col}>
            {announcements.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Comunicazioni</h2>
                  {/* STEP 4: "Tutte" → /newsroom */}
                  <Link href="/newsroom" className={styles.sectionLink}>Tutte →</Link>
                </div>
                <div className={styles.annList}>
                  {announcements.slice(0, 4).map((a: any) => (
                    // STEP 4: click apre direttamente AnnouncementModal
                    <button key={a.id} className={styles.annCard}
                      onClick={() => setSelectedAnn(a)}>
                      <div className={styles.annMeta}>
                        <span className={styles.annType} style={{
                          background: (TYPE_COLORS[a.type] || '#888') + '18',
                          color: TYPE_COLORS[a.type] || '#888',
                        }}>
                          {TYPE_LABELS[a.type] || a.type}
                        </span>
                        <span className={styles.annDate}>
                          {formatDate(a.publishedAt || a.createdAt)}
                        </span>
                      </div>
                      <div className={styles.annTitle}>{a.title}</div>
                      {a.body && (
                        <p className={styles.annBody}>
                          {a.body.slice(0, 120)}{a.body.length > 120 ? '…' : ''}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className={styles.ctaBox}>
              <div className={styles.ctaTitle}>Esplora il catalogo</div>
              <p className={styles.ctaDesc}>Scopri tutti i corsi disponibili per i software Serviform.</p>
              <Link href="/catalog" className={styles.ctaBtn}>Vai al catalogo →</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal comunicazione */}
      {selectedAnn && (
        <AnnouncementModal item={selectedAnn} onClose={() => setSelectedAnn(null)} />
      )}
    </div>
  )
}
