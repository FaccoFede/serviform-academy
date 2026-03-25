'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { SOFTWARE_BRANDS, LEVEL_COLORS, getBrand } from '@/lib/brands'
import styles from './CatalogPage.module.css'

interface Course {
  id: string
  title: string
  slug: string
  description?: string
  level?: string
  duration?: string
  publishState?: string
  available?: boolean
  software?: { slug: string; name: string; color?: string }
  units?: any[]
}

interface CatalogClientProps {
  courses: Course[]
}

const LEVELS = ['Base', 'Intermedio', 'Avanzato']

export default function CatalogClient({ courses }: CatalogClientProps) {
  const { user } = useAuth()
  const [familyFilter, setFamilyFilter] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Famiglie presenti dinamicamente
  const presentFamilies = useMemo(() => {
    const slugs = new Set(courses.map(c => c.software?.slug).filter(Boolean))
    return Object.values(SOFTWARE_BRANDS).filter(b => slugs.has(b.key))
  }, [courses])

  const filtered = useMemo(() => {
    return courses.filter(c => {
      if (familyFilter && c.software?.slug !== familyFilter) return false
      if (levelFilter && c.level !== levelFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!c.title.toLowerCase().includes(q) && !(c.description || '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [courses, familyFilter, levelFilter, search])

  function getState(course: Course): 'active' | 'locked' | 'preview' {
    if (!user) return 'preview'
    if (course.publishState === 'PUBLISHED' && course.available) return 'active'
    return 'locked'
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span>Catalogo</span>
          </div>
          <h1 className={styles.title}>Catalogo corsi</h1>
          <p className={styles.subtitle}>
            {courses.length} cors{courses.length === 1 ? 'o' : 'i'} disponibili per 4 famiglie software
          </p>
        </div>
      </div>

      <div className={styles.body}>
        {/* ── Sidebar filtri ── */}
        <aside className={styles.filters}>
          {/* Search */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Cerca</label>
            <div className={styles.searchWrap}>
              <svg viewBox="0 0 16 16" fill="none" width={14} height={14} className={styles.searchIcon}>
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Cerca corso..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className={styles.searchClear} onClick={() => setSearch('')}>×</button>
              )}
            </div>
          </div>

          {/* Famiglia */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Famiglia software</label>
            <div className={styles.filterOptions}>
              <button
                className={[styles.filterOption, familyFilter === null ? styles.filterOptionActive : ''].join(' ')}
                onClick={() => setFamilyFilter(null)}
              >
                Tutte
              </button>
              {presentFamilies.map(f => (
                <button
                  key={f.key}
                  className={[styles.filterOption, familyFilter === f.key ? styles.filterOptionActive : ''].join(' ')}
                  onClick={() => setFamilyFilter(f.key)}
                  style={familyFilter === f.key ? { background: f.light, color: f.color, borderColor: f.border } : {}}
                >
                  <span className={styles.filterDot} style={{ background: f.color }} />
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Livello */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Livello</label>
            <div className={styles.filterOptions}>
              <button
                className={[styles.filterOption, levelFilter === null ? styles.filterOptionActive : ''].join(' ')}
                onClick={() => setLevelFilter(null)}
              >
                Tutti
              </button>
              {LEVELS.map(l => (
                <button
                  key={l}
                  className={[styles.filterOption, levelFilter === l ? styles.filterOptionActive : ''].join(' ')}
                  onClick={() => setLevelFilter(l)}
                  style={levelFilter === l ? { background: (LEVEL_COLORS[l] + '18'), color: LEVEL_COLORS[l], borderColor: LEVEL_COLORS[l] + '44' } : {}}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {(familyFilter || levelFilter || search) && (
            <button
              className={styles.clearAll}
              onClick={() => { setFamilyFilter(null); setLevelFilter(null); setSearch('') }}
            >
              Rimuovi filtri
            </button>
          )}
        </aside>

        {/* ── Griglia corsi ── */}
        <main className={styles.grid}>
          <div className={styles.gridHeader}>
            <span className={styles.resultsCount}>{filtered.length} risultat{filtered.length === 1 ? 'o' : 'i'}</span>
          </div>

          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <svg viewBox="0 0 48 48" fill="none" width={48} height={48}>
                <circle cx="24" cy="24" r="20" stroke="var(--border)" strokeWidth="2" />
                <path d="M16 24h16M24 16v16" stroke="var(--border)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p>Nessun corso trovato per questi filtri.</p>
              <button onClick={() => { setFamilyFilter(null); setLevelFilter(null); setSearch('') }}>
                Rimuovi filtri
              </button>
            </div>
          ) : (
            <div className={styles.courseGrid}>
              {filtered.map(course => {
                const brand = getBrand(course.software?.slug || '')
                const state = getState(course)
                const levelColor = LEVEL_COLORS[course.level || ''] || 'var(--muted)'

                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className={[styles.card, state === 'locked' ? styles.cardLocked : ''].join(' ')}
                    style={{ '--sw-color': brand.color, '--sw-light': brand.light } as React.CSSProperties}
                  >
                    <div className={styles.cardAccent} />

                    <div className={styles.cardTop}>
                      <span className={styles.cardTag} style={{ background: brand.light, color: brand.color }}>
                        {brand.name}
                      </span>
                      {/* Badge stato */}
                      {state === 'active' && (
                        <span className={styles.stateBadgeActive}>● Disponibile</span>
                      )}
                      {state === 'locked' && (
                        <span className={styles.stateBadgeLocked}>
                          <svg viewBox="0 0 12 12" fill="none" width={10} height={10}>
                            <rect x="1" y="5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
                            <path d="M3.5 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                          </svg>
                          Richiedi accesso
                        </span>
                      )}
                      {state === 'preview' && (
                        <span className={styles.stateBadgePreview}>Anteprima</span>
                      )}
                    </div>

                    <h3 className={styles.cardTitle}>{course.title}</h3>
                    {course.description && (
                      <p className={styles.cardDesc}>{course.description}</p>
                    )}

                    <div className={styles.cardMeta}>
                      {course.duration && <span>{course.duration}</span>}
                      {course.units?.length > 0 && <span>{course.units.length} unità</span>}
                      {course.level && (
                        <span style={{ color: levelColor }}>{course.level}</span>
                      )}
                    </div>

                    <div className={styles.cardCta}>
                      {state === 'active' && <span className={styles.ctaText}>Vai al corso →</span>}
                      {state === 'locked' && <span className={styles.ctaLocked}>Scopri il corso →</span>}
                      {state === 'preview' && <span className={styles.ctaPreview}>Vedi anteprima →</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
