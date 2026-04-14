'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getBrand } from '@/lib/brands'
import styles from './Catalog.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// ── prop rinominata da initialCourses → courses, allineata con page.tsx ──────
export default function CatalogClient({ courses: rawCourses }: { courses: any[] }) {
  const { user, token } = useAuth()
  const searchParams = useSearchParams()
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '')

  // Guard difensivo: garantisce sempre un array anche se il server manda null/undefined
  const courses: any[] = Array.isArray(rawCourses) ? rawCourses : []

  const [q, setQ] = useState('')
  const [softwareFilter, setSoftwareFilter] = useState<string>('ALL')
  const [levelFilter, setLevelFilter] = useState<string>('ALL')
  const [progressMap, setProgressMap] = useState<Record<string, any>>({})

  // Carica il progresso di tutti i corsi se loggato
  useEffect(() => {
    if (!user || !token || courses.length === 0) return
    const h = { Authorization: 'Bearer ' + token }
    courses.forEach(c => {
      if (!c?.slug) return
      fetch(`${API_URL}/progress/course/${c.slug}`, { headers: h })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setProgressMap(prev => ({ ...prev, [c.slug]: d })) })
        .catch(() => {})
    })
  }, [user, token, courses])

  // Software unici — guard con optional chaining
  const softwares = useMemo(() => {
    const map = new Map<string, { slug: string; name: string }>()
    courses.forEach(c => {
      if (c?.software?.slug) map.set(c.software.slug, c.software)
    })
    return Array.from(map.values())
  }, [courses])

  // Livelli unici
  const levels = useMemo(() => {
    const set = new Set<string>()
    courses.forEach(c => { if (c?.level) set.add(c.level) })
    return Array.from(set)
  }, [courses])

  const filtered = useMemo(() => {
    let out = courses
    if (softwareFilter !== 'ALL') out = out.filter(c => c?.software?.slug === softwareFilter)
    if (levelFilter !== 'ALL') out = out.filter(c => c?.level === levelFilter)
    if (q.trim()) {
      const ql = q.toLowerCase()
      out = out.filter(c =>
        (c?.title || '').toLowerCase().includes(ql) ||
        (c?.description || '').toLowerCase().includes(ql)
      )
    }
    // Filtro "disponibili": esclude corsi in corso e completati
    if (statusFilter === 'available') {
      out = out.filter(c => {
        const prog = progressMap[c?.slug]
        if (!prog) return true            // nessun progresso = disponibile
        return prog.percent === 0         // non ancora iniziato = disponibile
      })
    }
    return out
  }, [courses, softwareFilter, levelFilter, q, statusFilter, progressMap])

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
            {filtered.length} corso{filtered.length !== 1 ? 'i' : ''} disponibil{filtered.length !== 1 ? 'i' : 'e'}
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
            {q && <button className={styles.searchClear} onClick={() => setQ('')}>×</button>}
          </div>

          {/* Filtro software */}
          <div className={styles.filterGroup}>
            {[{ slug: 'ALL', name: 'Tutti' }, ...softwares].map(s => {
              // Passa l'intero oggetto software come secondo arg per preferire i valori DB
              const brand = s.slug !== 'ALL' ? getBrand(s.slug, s) : null
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

          {/* Filtro disponibili — visibile solo se loggati */}
          {user && (
            <div className={styles.filterGroup}>
              <button
                className={[styles.chip, statusFilter === 'available' ? styles.chipActive : ''].join(' ')}
                style={statusFilter === 'available' ? { background: '#059669', borderColor: '#059669' } : {}}
                onClick={() => setStatusFilter(s => s === 'available' ? '' : 'available')}
              >
                {statusFilter === 'available' ? '✓ ' : ''}Disponibili
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Risultati ───────────────────────────────────────────────────── */}
      <div className={styles.resultsInner}>
        {courses.length === 0 ? (
          <div className={styles.empty}>
            <p>Nessun corso disponibile al momento.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>Nessun corso trovato per i filtri selezionati.</p>
            <button onClick={() => { setQ(''); setSoftwareFilter('ALL'); setLevelFilter('ALL') }}>
              Rimuovi filtri
            </button>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {filtered.map(course => {
              const brand = getBrand(course?.software?.slug, course?.software)
              const prog = progressMap[course?.slug]
              const isActive = course?.publishState === 'PUBLISHED'
              const hasProgress = prog && prog.percent > 0
              const isDone = prog && prog.percent >= 100
              const unitCount = (course?.units || []).filter((u: any) => u?.unitType !== 'OVERVIEW').length

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

// ─── Card corso ──────────────────────────────────────────────────────────────

function CourseCard({ course, brand, prog, hasProgress, isDone, isActive, unitCount, isLoggedIn }: {
  course: any; brand: any; prog: any; hasProgress: boolean
  isDone: boolean; isActive: boolean; unitCount: number; isLoggedIn: boolean
}) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className={[styles.card, !isActive ? styles.cardLocked : ''].join(' ')}
    >
      <div className={styles.cardAccent} style={{ background: brand.color }}/>

      <div className={styles.cardThumb} style={{ background: brand.light }}>
        <span className={styles.cardThumbLabel} style={{ color: brand.color }}>{brand.name}</span>
        {isDone && <span className={styles.cardThumbBadgeDone}>✓</span>}
      </div>

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
            <span className={styles.stateBadgeLocked}>Bloccato</span>
          ) : (
            <span className={styles.stateBadgePreview}>Disponibile</span>
          )}
        </div>

        <h3 className={styles.cardTitle}>{course.title}</h3>

        {course.description && (
          <p className={styles.cardDesc}>{course.description}</p>
        )}

        {isLoggedIn && hasProgress && !isDone && (
          <div className={styles.cardProgressWrap}>
            <div className={styles.cardProgressTrack}>
              <div className={styles.cardProgressFill} style={{ width: `${prog.percent}%` }}/>
            </div>
            <span className={styles.cardProgressLabel}>{prog.completed}/{prog.total} unità</span>
          </div>
        )}

        <div className={styles.cardFoot}>
          {course.level && <span className={styles.footItem}>{course.level}</span>}
          {course.duration && <span className={styles.footItem}>{course.duration}</span>}
          {unitCount > 0 && <span className={styles.footItem}>{unitCount} unità</span>}
          <span className={styles.cardCta}>
            {isLoggedIn && hasProgress && !isDone ? 'Continua →'
              : isLoggedIn && isDone ? 'Rileggi →'
              : isActive ? 'Inizia →' : 'Dettagli →'}
          </span>
        </div>
      </div>
    </Link>
  )
}
