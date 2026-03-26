'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import styles from './Newsroom.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const TYPE_LABELS: Record<string, string> = {
  NEWS: 'Novità', NEW_COURSE: 'Nuovo corso', WEBINAR: 'Webinar', MAINTENANCE: 'Manutenzione',
}
const TYPE_COLORS: Record<string, string> = {
  NEWS: '#067DB8', NEW_COURSE: '#E63329', WEBINAR: '#059669', MAINTENANCE: '#D97706',
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function NewsroomPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [q, setQ] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'type'>('date')

  useEffect(() => {
    const headers: any = {}
    if (token) headers['Authorization'] = 'Bearer ' + token
    fetch(API_URL + '/announcements', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(d => setItems(d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const types = useMemo(() => ['ALL', ...Array.from(new Set(items.map((a: any) => a.type)))], [items])

  const filtered = useMemo(() => {
    let out = items
    if (filter !== 'ALL') out = out.filter((a: any) => a.type === filter)
    if (q) {
      const ql = q.toLowerCase()
      out = out.filter((a: any) =>
        a.title.toLowerCase().includes(ql) || (a.body || '').toLowerCase().includes(ql)
      )
    }
    if (sortBy === 'type') {
      out = [...out].sort((a, b) => (a.type || '').localeCompare(b.type || ''))
    }
    return out
  }, [items, filter, q, sortBy])

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  const stats = {
    total: items.length,
    unread: items.filter((a: any) => !a.read).length,
    pinned: items.filter((a: any) => a.type === 'NEW_COURSE').length,
    upcoming: items.filter((a: any) => a.type === 'WEBINAR').length,
  }

  return (
    <div className={styles.page}>
      {/* Subheader */}
      <div className={styles.subheader}>
        <div className={styles.subheaderInner}>
          <div className={styles.breadcrumb}>
            <Link href="/dashboard" className={styles.bcLink}>dashboard</Link>
            <span>/</span>
            <span>newsroom</span>
          </div>
          <div className={styles.subheaderTitle}>
            <h1 className={styles.pageTitle}>Newsroom</h1>
          </div>
          <div className={styles.subheaderTab}>
            <span className={styles.tabActive}>Home newsroom</span>
          </div>
        </div>
      </div>

      <div className={styles.inner}>
        {/* HERO con data */}
        <div className={styles.hero}>
          <div className={styles.heroText}>
            <h2 className={styles.heroTitle}>In evidenza oggi,<br/><span>{today}</span></h2>
            <p className={styles.heroDesc}>Controlla sempre le comunicazioni per restare aggiornato sulle novità ed eventi</p>
          </div>
          <div className={styles.heroDecoShape}/>
        </div>

        {/* Stats KPI (ispirazione newsroom.png) */}
        <div className={styles.kpiRow}>
          {[
            { icon: <svg viewBox="0 0 20 20" fill="none" width={18} height={18}><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M7 10h6M10 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, label: 'Comunicati da leggere', val: stats.unread, sub: 'non letti', dot: '#E63329' },
            { icon: <svg viewBox="0 0 20 20" fill="none" width={18} height={18}><path d="M4 4h12v10H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 8h4M8 11h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, label: 'Comunicati in primo piano', val: stats.pinned, sub: 'in evidenza', dot: '#D97706' },
            { icon: <svg viewBox="0 0 20 20" fill="none" width={18} height={18}><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, label: 'Webinar e eventi', val: stats.upcoming, sub: 'in calendario', dot: '#059669' },
            { icon: <svg viewBox="0 0 20 20" fill="none" width={18} height={18}><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/></svg>, label: 'Totale comunicazioni', val: stats.total, sub: 'disponibili', dot: '#067DB8' },
          ].map((k, i) => (
            <div key={i} className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>{k.label}</span>
                <span className={styles.kpiIco} style={{ color: k.dot }}>{k.icon}</span>
                <span className={styles.kpiDot} style={{ background: k.dot }}/>
              </div>
              <div className={styles.kpiVal}>
                <span className={styles.kpiNum}>{k.val}</span>
                <span className={styles.kpiSub}>{k.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Barra filtri/ricerca */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <h3 className={styles.toolbarTitle}>Comunicati da leggere</h3>
            <p className={styles.toolbarSub}>Elenco delle comunicazioni da leggere</p>
          </div>
          <div className={styles.toolbarRight}>
            <div className={styles.searchBox}>
              <svg viewBox="0 0 14 14" fill="none" width={13} height={13} style={{ color: 'var(--muted)', flexShrink: 0 }}>
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M10 10l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input className={styles.searchInput} placeholder="Cerca comunicazioni..." value={q} onChange={e => setQ(e.target.value)}/>
              {q && <button className={styles.searchClear} onClick={() => setQ('')}>×</button>}
            </div>
            <div className={styles.sortSelect}>
              <label>Ordina per:</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className={styles.select}>
                <option value="date">più recente</option>
                <option value="type">tipo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filtri tipo */}
        <div className={styles.filterRow}>
          {types.map(t => (
            <button
              key={t}
              className={[styles.filterChip, filter === t ? styles.filterChipOn : ''].join(' ')}
              onClick={() => setFilter(t)}
              style={filter === t && t !== 'ALL' ? { background: TYPE_COLORS[t] + '15', color: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] + '55' } : {}}
            >
              {t !== 'ALL' && <span className={styles.chipDot} style={{ background: TYPE_COLORS[t] || 'var(--muted)' }}/>}
              {t === 'ALL' ? 'Tutte' : TYPE_LABELS[t] || t}
              {t !== 'ALL' && <span className={styles.chipCount}>{items.filter(a => a.type === t).length}</span>}
            </button>
          ))}
        </div>

        {/* Lista comunicati */}
        {loading ? (
          <div className={styles.loadingRows}>
            {[1,2,3].map(i => <div key={i} className={styles.loadingRow} style={{ animationDelay: `${i * 0.1}s` }}/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg viewBox="0 0 64 64" fill="none" width={48} height={48}>
                <rect x="10" y="8" width="44" height="48" rx="4" stroke="var(--border)" strokeWidth="2"/>
                <path d="M22 22h20M22 30h20M22 38h12" stroke="var(--border)" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="44" cy="44" r="12" fill="var(--surface)" stroke="var(--border)" strokeWidth="2"/>
                <path d="M40 44h8M44 40v8" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Nessuna comunicazione</h3>
            <p>Non vi sono comunicazioni da visualizzare</p>
            {(filter !== 'ALL' || q) && (
              <button className={styles.emptyReset} onClick={() => { setFilter('ALL'); setQ('') }}>
                Rimuovi filtri
              </button>
            )}
          </div>
        ) : (
          <div className={styles.articleList}>
            {filtered.map(a => {
              const color = TYPE_COLORS[a.type] || 'var(--muted)'
              return (
                <article key={a.id} className={styles.article}>
                  <div className={styles.articleLeft}>
                    <div className={styles.articleType} style={{ color, borderColor: color + '44', background: color + '0E' }}>
                      {TYPE_LABELS[a.type] || a.type}
                    </div>
                  </div>
                  <div className={styles.articleBody}>
                    <h3 className={styles.articleTitle}>{a.title}</h3>
                    <p className={styles.articleDesc}>{a.body}</p>
                  </div>
                  <div className={styles.articleRight}>
                    {a.publishedAt && (
                      <span className={styles.articleDate}>
                        {formatDate(a.publishedAt)}
                      </span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
