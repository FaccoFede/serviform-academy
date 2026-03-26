'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SOFTWARE_BRANDS, LEVEL_COLORS, getBrand } from '@/lib/brands'
import styles from './Catalog.module.css'

export default function CatalogClient({ courses }: { courses: any[] }) {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [family, setFamily] = useState(searchParams.get('family') || '')
  const [level, setLevel] = useState('')
  const [q, setQ] = useState('')

  const families = useMemo(() => {
    const slugs = new Set(courses.map(c => c.software?.slug).filter(Boolean))
    return Object.values(SOFTWARE_BRANDS).filter(b => slugs.has(b.key))
  }, [courses])

  const filtered = useMemo(() => courses.filter(c => {
    if (family && c.software?.slug !== family) return false
    if (level && c.level !== level) return false
    if (q) {
      const ql = q.toLowerCase()
      if (!c.title.toLowerCase().includes(ql) && !(c.description||'').toLowerCase().includes(ql)) return false
    }
    return true
  }), [courses, family, level, q])

  const hasFilters = !!(family || level || q)
  const clearAll = () => { setFamily(''); setLevel(''); setQ('') }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.breadcrumb}><Link href="/" className={styles.bcLink}>Home</Link><span>/</span><span>Catalogo</span></div>
          <h1 className={styles.title}>Catalogo corsi</h1>
          <p className={styles.sub}>{courses.length} cors{courses.length===1?'o':'i'} disponibili · 4 famiglie software</p>
        </div>
      </div>

      {/* Barra filtri orizzontale */}
      <div className={styles.filterBar}>
        <div className={styles.filterBarInner}>
          {/* Ricerca */}
          <div className={styles.searchBox}>
            <svg viewBox="0 0 14 14" fill="none" width={13} height={13} style={{color:'var(--muted)',flexShrink:0}}>
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Cerca corsi..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            {q && <button className={styles.searchClear} onClick={() => setQ('')}>×</button>}
          </div>

          {/* Famiglia */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Software</span>
            <div className={styles.chipRow}>
              <button className={[styles.chip, !family ? styles.chipOn : ''].join(' ')} onClick={() => setFamily('')}>Tutti</button>
              {families.map(f => (
                <button
                  key={f.key}
                  className={[styles.chip, family === f.key ? styles.chipOn : ''].join(' ')}
                  onClick={() => setFamily(f.key)}
                  style={family === f.key ? {background:f.light,color:f.color,borderColor:f.border} : {}}
                >
                  <span className={styles.chipDot} style={{background:f.color}}/>
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Livello */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Livello</span>
            <div className={styles.chipRow}>
              <button className={[styles.chip, !level ? styles.chipOn : ''].join(' ')} onClick={() => setLevel('')}>Tutti</button>
              {['Base','Intermedio','Avanzato'].map(l => (
                <button
                  key={l}
                  className={[styles.chip, level === l ? styles.chipOn : ''].join(' ')}
                  onClick={() => setLevel(l)}
                  style={level === l ? {background:((LEVEL_COLORS[l]||'')+'18'),color:LEVEL_COLORS[l]||'var(--ink)',borderColor:(LEVEL_COLORS[l]||'')+'44'} : {}}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button className={styles.clearBtn} onClick={clearAll}>Rimuovi filtri ×</button>
          )}
        </div>
      </div>

      {/* Risultati */}
      <div className={styles.results}>
        <div className={styles.resultsInner}>
          <div className={styles.resultMeta}>
            <span className={styles.resultCount}>{filtered.length} risultat{filtered.length===1?'o':'i'}</span>
            {hasFilters && <span className={styles.resultActive}>Filtri attivi: {[family && families.find(f=>f.key===family)?.name, level, q&&`"${q}"`].filter(Boolean).join(', ')}</span>}
          </div>

          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <svg viewBox="0 0 48 48" fill="none" width={40} height={40}><circle cx="24" cy="24" r="20" stroke="var(--border)" strokeWidth="2"/><path d="M16 24h16M24 16v16" stroke="var(--border)" strokeWidth="2" strokeLinecap="round"/></svg>
              <p>Nessun corso trovato.</p>
              <button onClick={clearAll}>Rimuovi tutti i filtri</button>
            </div>
          ) : (
            <div className={styles.cardGrid}>
              {filtered.map(c => {
                const brand = getBrand(c.software?.slug || '')
                const isActive = c.available !== false
                const firstUnitSlug = c.units?.filter((u: any) => u.unitType !== 'OVERVIEW')?.[0]?.slug
                return (
                  <div key={c.id} className={styles.card}>
                    <div className={styles.cardAccent} style={{background:brand.color}}/>
                    <div className={styles.cardTop}>
                      <span className={styles.cardTag} style={{background:brand.light,color:brand.color}}>{brand.name}</span>
                      {user ? (
                        isActive
                          ? <span className={styles.badgeActive}>● Disponibile</span>
                          : <span className={styles.badgeLocked}>🔒 Richiedi accesso</span>
                      ) : (
                        <span className={styles.badgePreview}>Anteprima</span>
                      )}
                    </div>
                    <Link href={`/courses/${c.slug}`} className={styles.cardTitleLink}>
                      <h3 className={styles.cardTitle}>{c.title}</h3>
                    </Link>
                    {c.description && <p className={styles.cardDesc}>{c.description}</p>}
                    <div className={styles.cardFoot}>
                      {c.duration && <span>{c.duration}</span>}
                      {c.units?.length > 0 && <span>{c.units.filter((u:any)=>u.unitType!=='OVERVIEW').length} unità</span>}
                      {c.level && <span style={{color:LEVEL_COLORS[c.level]||'var(--muted)'}}>{c.level}</span>}
                    </div>
                    <div className={styles.cardActions}>
                      <Link href={`/courses/${c.slug}`} className={styles.cardCta}>
                        {user ? (isActive ? 'Vai al corso' : 'Scopri') : 'Dettagli'}
                      </Link>
                      {/* Anteprima gratuita sempre visibile per non loggati */}
                      {!user && firstUnitSlug && (
                        <Link href={`/courses/${c.slug}/${firstUnitSlug}`} className={styles.cardPreviewBtn}>
                          ▶ Prova gratis
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
