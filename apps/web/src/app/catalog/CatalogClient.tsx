'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useProgress } from '@/context/ProgressContext'
import { getBrand, LEVEL_COLORS } from '@/lib/brands'
import styles from './Catalog.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function CatalogClient({ initialCourses }: { initialCourses: any[] }) {
  const { user, token } = useAuth()
  const { courseProgress, loadCompletedUnitsFromServer } = useProgress()
  const [courses] = useState<any[]>(initialCourses)
  const [q, setQ] = useState('')
  const [softwareFilter, setSoftwareFilter] = useState<string>('ALL')
  const [levelFilter, setLevelFilter] = useState<string>('ALL')
  const [progressMap, setProgressMap] = useState<Record<string, any>>({})

  // Carica il progresso di tutti i corsi se loggato
  useEffect(() => {
    if (!user || !token) return
    const h = { Authorization: 'Bearer ' + token }
    courses.forEach(c => {
      fetch(`${API_URL}/progress/course/${c.slug}`, { headers: h })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d) setProgressMap(prev => ({ ...prev, [c.slug]: d }))
        })
        .catch(() => {})
    })
  }, [user, token, courses])

  // Software unici
  const softwares = useMemo(() => {
    const map = new Map<string, { slug: string; name: string }>()
    courses.forEach(c => {
      if (c.software) map.set(c.software.slug, c.software)
    })
    return Array.from(map.values())
  }, [courses])

  // Livelli unici
  const levels = useMemo(() => {
    const set = new Set<string>()
    courses.forEach(c => { if (c.level) set.add(c.level) })
    return Array.from(set)
  }, [courses])

  const filtered = useMemo(() => {
    let out = courses
    if (softwareFilter !== 'ALL') out = out.filter(c => c.software?.slug === softwareFilter)
    if (levelFilter !== 'ALL') out = out.filter(c => c.level === levelFilter)
    if (q.trim()) {
      const ql = q.toLowerCase()
      out = out.filter(c =>
        c.title.toLowerCase().includes(ql) ||
        (c.description || '').toLowerCase().includes(ql)
      )
    }
    return out
  }, [courses, softwareFilter, levelFilter, q])

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <nav className={styles.breadcrumb}>
            {user
              ? <><Link href="/dashboard" className={styles.bcLink}>dashboard</Link><span>/</span><span>catalogo</span></>
              : <span>catalogo</span>
            }
          </nav>
          <h1 className={styles.title}>Catalogo corsi</h1>
          <p className={styles.sub}>
            {filtered.length} corso{filtered.length !== 1 ? 'i' : ''} disponibili
          </p>
        </div>
      </div>

      {/* ── Barra filtri ────────────────────────────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.filterBarInner}>
          {/* Ricerca */}
          <div className={styles.searchBox}>
            <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
              <circle cx="6" cy="6" r="4.5" stroke="var(--muted)" strokeWidth="1.2"/>
              <path d="M9.5 9.5l3 3" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Cerca corsi..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            {q && (
              <button className={styles.searchClear} onClick={() => setQ('')}>×</button>
            )}
          </div>

          {/* Filtro software */}
          <div className={styles.filterGroup}>
            {[{ slug: 'ALL', name: 'Tutti' }, ...softwares].map(s => {
              const brand = s.slug !== 'ALL' ? getBrand(s.slug) : null
              const active = softwareFilter === s.slug
              return (
                <button
                  key={s.slug}
                  className={[styles.chip, active ? styles.chipActive : ''].join(' ')}
                  style={active && brand ? { background: brand.color, borderColor: brand.color, color: '#fff' } : {}}
                  onClick={() => setSoftwareFilter(s.slug)}
                >
                  {brand && <span className={styles.chipDot} style={{ background: active ? '#fff' : brand.color }}/>}
                  {s.name}
                </button>
              )
            })}
          </div>

          {/* Filtro livello */}
          {levels.length > 0 && (
            <div className={styles.filterGroup}>
              {[{ value: 'ALL', label: 'Tutti i livelli' }, ...levels.map(l => ({ value: l, label: l }))].map(l => (
                <button
                  key={l.value}
                  className={[styles.chip, levelFilter === l.value ? styles.chipActive : ''].join(' ')}
                  onClick={() => setLevelFilter(l.value)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Risultati ───────────────────────────────────────────────────── */}
      <div className={styles.resultsInner}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>Nessun corso trovato per i filtri selezionati.</p>
            <button onClick={() => { setQ(''); setSoftwareFilter('ALL'); setLevelFilter('ALL') }}>
              Rimuovi filtri
            </button>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {filtered.map(course => {
              const brand = getBrand(course.software?.slug || '')
              const prog = progressMap[course.slug]
              const isActive = course.available !== false
              const hasProgress = prog && prog.percent > 0
              const isDone = prog && prog.percent >= 100
              const unitCount = course.units?.filter((u: any) => u.unitType !== 'OVERVIEW').length || 0

              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  brand={brand}
                  prog={prog}
                  hasProgress={hasProgress}
                  isDone={isDone}
                  isActive={isActive}
                  unitCount={unitCount}
                  isLoggedIn={!!user}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Componente Card ─────────────────────────────────────────────────────────

function CourseCard({
  course, brand, prog, hasProgress, isDone, isActive, unitCount, isLoggedIn
}: {
  course: any
  brand: any
  prog: any
  hasProgress: boolean
  isDone: boolean
  isActive: boolean
  unitCount: number
  isLoggedIn: boolean
}) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className={[styles.card, !isActive ? styles.cardLocked : ''].join(' ')}
    >
      {/* Accent line colorata in cima */}
      <div className={styles.cardAccent} style={{ background: brand.color }}/>

      {/* Thumbnail / placeholder famiglia */}
      <div className={styles.cardThumb} style={{ background: brand.light }}>
        <span className={styles.cardThumbLabel} style={{ color: brand.color }}>
          {brand.name}
        </span>
        {isDone && (
          <span className={styles.cardThumbBadgeDone}>✓</span>
        )}
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={styles.cardTag} style={{ background: brand.light, color: brand.color }}>
            {brand.name}
          </span>
          {isLoggedIn && isDone ? (
            <span className={styles.stateBadgeActive}>✓ Completato</span>
          ) : isLoggedIn && hasProgress ? (
            <span className={styles.stateBadgeProgress}>{prog.percent}%</span>
          ) : !isActive ? (
            <span className={styles.stateBadgeLocked}>
              <svg viewBox="0 0 10 12" fill="none" width={9} height={10}>
                <rect x="1" y="4.5" width="8" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M3 4.5V3a2 2 0 114 0v1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
              Bloccato
            </span>
          ) : (
            <span className={styles.stateBadgePreview}>Disponibile</span>
          )}
        </div>

        <h3 className={styles.cardTitle}>{course.title}</h3>

        {course.description && (
          <p className={styles.cardDesc}>{course.description}</p>
        )}

        {/* Progress bar se in corso */}
        {isLoggedIn && hasProgress && !isDone && (
          <div className={styles.cardProgressWrap}>
            <div className={styles.cardProgressTrack}>
              <div className={styles.cardProgressFill} style={{ width: `${prog.percent}%` }}/>
            </div>
            <span className={styles.cardProgressLabel}>{prog.completed}/{prog.total} unità</span>
          </div>
        )}

        {/* Meta */}
        <div className={styles.cardFoot}>
          {course.level && (
            <span className={styles.footItem}>{course.level}</span>
          )}
          {course.duration && (
            <span className={styles.footItem}>{course.duration}</span>
          )}
          {unitCount > 0 && (
            <span className={styles.footItem}>{unitCount} unità</span>
          )}

          {/* CTA */}
          <span className={styles.cardCta}>
            {isLoggedIn && hasProgress && !isDone
              ? 'Continua →'
              : isLoggedIn && isDone
                ? 'Rileggi →'
                : isActive
                  ? 'Inizia →'
                  : 'Dettagli →'
            }
          </span>
        </div>
      </div>
    </Link>
  )
}
