'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import styles from './Communications.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const TYPE_LABELS: Record<string, string> = {
  NEWS: 'Novità', NEW_COURSE: 'Nuovo corso', WEBINAR: 'Webinar', MAINTENANCE: 'Manutenzione',
}
const TYPE_COLORS: Record<string, string> = {
  NEWS: '#067DB8', NEW_COURSE: '#E63329', WEBINAR: '#059669', MAINTENANCE: '#D97706',
}

export default function CommunicationsPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState<'recent' | 'type'>('recent')
  const [q, setQ] = useState('')

  useEffect(() => {
    const headers: any = {}
    if (token) headers['Authorization'] = 'Bearer ' + token
    fetch(API_URL + '/announcements', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(d => setItems(d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const filtered = useMemo(() => {
    let out = items
    if (filter !== 'ALL') out = out.filter((a: any) => a.type === filter)
    if (q) {
      const ql = q.toLowerCase()
      out = out.filter((a: any) => a.title.toLowerCase().includes(ql) || (a.body || '').toLowerCase().includes(ql))
    }
    if (sortBy === 'type') out = [...out].sort((a, b) => (a.type || '').localeCompare(b.type || ''))
    return out
  }, [items, filter, sortBy, q])

  const types = useMemo(() => Array.from(new Set(items.map((a: any) => a.type))), [items])

  return (
    <div className={styles.page}>
      {/* Header sezione */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.breadcrumb}>
              <Link href="/dashboard" className={styles.bcLink}>dashboard</Link>
              <span>/</span>
              <span>comunicazioni</span>
            </div>
            <h1 className={styles.title}>Comunicazioni, news ed eventi</h1>
            <p className={styles.subtitle}>Controlla sempre le comunicazioni per restare aggiornato sulle novità ed eventi</p>
          </div>
          <div className={styles.headerRight}>
            <Link href="/newsroom" className={styles.newsroomBtn}>
              <svg viewBox="0 0 14 14" fill="none" width={13} height={13}><rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 5h6M4 7.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              Newsroom
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.inner}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarFilters}>
            {/* Filtri rapidi tipo */}
            <div className={styles.typeFilters}>
              <button
                className={[styles.typeBtn, filter === 'ALL' ? styles.typeBtnActive : ''].join(' ')}
                onClick={() => setFilter('ALL')}
              >
                Tutti <span className={styles.typeBadge}>{items.length}</span>
              </button>
              {types.map(t => (
                <button
                  key={t}
                  className={[styles.typeBtn, filter === t ? styles.typeBtnActive : ''].join(' ')}
                  onClick={() => setFilter(filter === t ? 'ALL' : t)}
                  style={filter === t ? { background: TYPE_COLORS[t] + '15', color: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] + '55' } : {}}
                >
                  <span className={styles.typeDot} style={{ background: TYPE_COLORS[t] || 'var(--muted)' }}/>
                  {TYPE_LABELS[t] || t}
                  <span className={styles.typeBadge}>{items.filter((a: any) => a.type === t).length}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.toolbarActions}>
            {/* Search */}
            <div className={styles.searchBox}>
              <svg viewBox="0 0 14 14" fill="none" width={12} height={12} style={{ color: 'var(--muted)' }}>
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M10 10l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input className={styles.searchInput} placeholder="Cerca..." value={q} onChange={e => setQ(e.target.value)}/>
              {q && <button className={styles.searchClear} onClick={() => setQ('')}>×</button>}
            </div>

            {/* Sort */}
            <div className={styles.sortRow}>
              <span className={styles.sortLabel}>Ordina per:</span>
              <button className={[styles.sortBtn, sortBy === 'recent' ? styles.sortBtnActive : ''].join(' ')} onClick={() => setSortBy('recent')}>
                più recente
              </button>
              <button className={[styles.sortBtn, sortBy === 'type' ? styles.sortBtnActive : ''].join(' ')} onClick={() => setSortBy('type')}>
                tipo
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.loading}>
            {[1,2,3,4].map(i => <div key={i} className={styles.loadRow} style={{ animationDelay: `${i * 0.08}s` }}/>)}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state ispirazione sezcom.png */
          <div className={styles.empty}>
            <div className={styles.emptyBox}>
              <svg viewBox="0 0 64 64" fill="none" width={44} height={44}>
                <rect x="8" y="6" width="38" height="48" rx="3" stroke="var(--border)" strokeWidth="2"/>
                <path d="M16 18h22M16 26h22M16 34h14" stroke="var(--border)" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="46" cy="46" r="14" fill="var(--surface)" stroke="var(--border)" strokeWidth="2"/>
                <circle cx="46" cy="42" r="4" stroke="var(--red)" strokeWidth="1.5"/>
                <path d="M42 48l8-8" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <h3 className={styles.emptyTitle}>Nessuna comunicazione</h3>
              <p className={styles.emptyDesc}>Non vi sono comunicazioni da visualizzare</p>
              {(filter !== 'ALL' || q) && (
                <button className={styles.emptyBtn} onClick={() => { setFilter('ALL'); setQ('') }}>
                  Rimuovi filtri
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.list}>
            <div className={styles.listHeader}>
              <span className={styles.listCount}>{filtered.length} comunicazion{filtered.length === 1 ? 'e' : 'i'}</span>
            </div>

            {filtered.map(a => {
              const color = TYPE_COLORS[a.type] || 'var(--muted)'
              const date = a.publishedAt
                ? new Date(a.publishedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
                : null

              return (
                <div key={a.id} className={styles.item}>
                  <div className={styles.itemAccent} style={{ background: color }}/>
                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemType} style={{ color, background: color + '12', borderColor: color + '30' }}>
                        {TYPE_LABELS[a.type] || a.type}
                      </span>
                      {date && <span className={styles.itemDate}>{date}</span>}
                    </div>
                    <h3 className={styles.itemTitle}>{a.title}</h3>
                    <p className={styles.itemBody}>{a.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
