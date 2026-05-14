'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import AnnouncementModal from '@/components/ui/AnnouncementModal'
import { api } from '@/lib/api'
import styles from './Newsroom.module.css'

// ── Metadati tipo comunicazione ───────────────────────────────────────────
const TYPE_META: Record<string, { label: string; color: string }> = {
  COMUNICAZIONE: { label: 'Comunicazione', color: '#067DB8' },
  NEW_COURSE:    { label: 'Nuovo corso',   color: '#E63329' },
  WEBINAR:       { label: 'Webinar',       color: '#059669' },
  MAINTENANCE:   { label: 'Manutenzione',  color: '#D97706' },
  WORKSHOP:      { label: 'Workshop',      color: '#D97706' },
  EVENTO:        { label: 'Evento',        color: '#059669' },
  // legacy — per eventuali record non ancora migrati
  NEWS:          { label: 'Novità',        color: '#067DB8' },
  EVENTS:        { label: 'Evento',        color: '#059669' },
  PRESS:         { label: 'Comunicato',    color: '#7C3AED' },
  RULES:         { label: 'Regola',        color: '#D97706' },
}

const EVENT_TYPE_META: Record<string, { label: string; color: string }> = {
  WORKSHOP:     { label: 'Workshop',      color: '#059669' },
  WEBINAR:      { label: 'Webinar',       color: '#059669' },
  LIVE_SESSION: { label: 'Sessione live', color: '#059669' },
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

// ── Tipo filtro attivo ────────────────────────────────────────────────────
type FilterKey = 'ALL' | 'UNREAD' | 'PINNED' | 'EVENTS'

// ── Card singola comunicazione ────────────────────────────────────────────
function AnnCard({ item, onClick }: { item: any; onClick: () => void }) {
  const meta = TYPE_META[item.section] || TYPE_META[item.type] || { label: item.section || item.type, color: '#888' }
  const bg   = meta.color + '18'

  return (
    <button className={styles.annCard} onClick={onClick}>
      <div className={styles.annCardImg}>
        {item.bannerUrl
          ? <img src={item.bannerUrl} alt="" className={styles.annCardImgEl} />
          : <div className={styles.annCardImgPlaceholder} />
        }
        {item.isPinned && (
          <span className={styles.pinnedBadge}>
            <svg viewBox="0 0 12 12" fill="none" width={10} height={10}>
              <path d="M4 2a1.5 1.5 0 011.5-1.5h1A1.5 1.5 0 018 2v7l-2-1-2 1V2z"
                stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            In primo piano
          </span>
        )}
      </div>

      <div className={styles.annCardBody}>
        <div className={styles.annCardMeta}>
          <span
            className={styles.annCardType}
            style={{ background: bg, color: meta.color }}
          >
            {meta.label}
          </span>
          <span className={styles.annCardDate}>
            {formatDate(item.publishedAt || item.createdAt)}
          </span>
        </div>
        <h3 className={styles.annCardTitle}>{item.title}</h3>
        {item.body && (
          <p className={styles.annCardDesc}>
            {item.body.slice(0, 160)}{item.body.length > 160 ? '…' : ''}
          </p>
        )}
        <span className={styles.annCardCta}>Leggi →</span>
      </div>
    </button>
  )
}

// ── Card singolo evento ───────────────────────────────────────────────────
function EventCard({ ev }: { ev: any }) {
  const meta = EVENT_TYPE_META[ev.eventType] || { label: ev.eventType, color: '#059669' }
  const bg   = meta.color + '18'
  const isPast = new Date(ev.date) < new Date()

  return (
    <div className={[styles.annCard, styles.eventCardWrap].join(' ')}>
      <div className={styles.annCardImg}>
        {ev.bannerUrl
          ? <img src={ev.bannerUrl} alt="" className={styles.annCardImgEl} />
          : <div className={[styles.annCardImgPlaceholder, styles.eventImgPlaceholder].join(' ')} />
        }
        {isPast && (
          <span className={styles.pinnedBadge} style={{ background: 'rgba(0,0,0,.55)' }}>
            Concluso
          </span>
        )}
      </div>

      <div className={styles.annCardBody}>
        <div className={styles.annCardMeta}>
          <span
            className={styles.annCardType}
            style={{ background: bg, color: meta.color }}
          >
            {meta.label}
          </span>
          <span className={styles.annCardDate}>
            {formatDate(ev.date)}
          </span>
        </div>
        <h3 className={styles.annCardTitle}>{ev.title}</h3>
        {ev.description && (
          <p className={styles.annCardDesc}>
            {ev.description.slice(0, 120)}{ev.description.length > 120 ? '…' : ''}
          </p>
        )}
        {ev.location && (
          <p className={styles.eventCardLocation}>
            <svg viewBox="0 0 14 14" fill="none" width={11} height={11} style={{ flexShrink: 0 }}>
              <path d="M7 1a4 4 0 010 8C4.5 9 2 6.5 2 5a5 5 0 0110 0c0 1.5-2.5 4-5 4z"
                stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="7" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            {ev.location}
          </p>
        )}
        <div className={styles.eventCardActions}>
          <span className={styles.annCardCta} style={{ color: meta.color }}>Evento →</span>
        </div>
      </div>
    </div>
  )
}

// ── Componente principale ─────────────────────────────────────────────────
export default function NewsroomPage() {
  const { token } = useAuth()

  const [items,   setItems]   = useState<any[]>([])
  const [events,  setEvents]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<FilterKey>('ALL')
  const [q,       setQ]       = useState('')
  const [sortBy,  setSortBy]  = useState<'date' | 'type'>('date')
  const [selected, setSelected] = useState<any>(null)

  // ── Fetch comunicazioni ─────────────────────────────────────────────
  useEffect(() => {
    const load = token ? api.announcements.findPublished() : api.announcements.findPublic()
    load
      .then(d => setItems(d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  // ── Fetch eventi ────────────────────────────────────────────────────
  useEffect(() => {
    api.events.findAll()
      .then(d => setEvents(d || []))
      .catch(() => {})
  }, [])

  // ── Statistiche KPI ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date()
    const futureEvents = events.filter(e => new Date(e.date) >= now).length
    return {
      total:   items.length,
      unread:  items.filter(a => !a.read).length,
      pinned:  items.filter(a => a.isPinned).length,
      webinar: futureEvents,
    }
  }, [items, events])

  // ── Lista filtrata ────────────────────────────────────────────────────
  // Quando filter === 'EVENTS' mostra solo eventi futuri come card evento.
  // Quando filter === 'ALL' mostra comunicazioni + eventi futuri misti per data.
  // Negli altri filtri (UNREAD/PINNED) mostra solo comunicazioni filtrate.
  const { filteredItems, filteredEvents } = useMemo(() => {
    const now = new Date()

    if (filter === 'EVENTS') {
      const evs = events
        .filter(e => new Date(e.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      return { filteredItems: [], filteredEvents: evs }
    }

    let out = items
    if (filter === 'UNREAD') out = out.filter(a => !a.read)
    if (filter === 'PINNED') out = out.filter(a => a.isPinned)

    if (q) {
      const ql = q.toLowerCase()
      out = out.filter(a =>
        a.title.toLowerCase().includes(ql) || (a.body || '').toLowerCase().includes(ql)
      )
    }
    if (sortBy === 'type') {
      out = [...out].sort((a, b) => (a.type || '').localeCompare(b.type || ''))
    }

    // In modalità ALL: includi anche eventi futuri nella lista
    if (filter === 'ALL' && !q) {
      const upcomingEvs = events
        .filter(e => new Date(e.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      return { filteredItems: out, filteredEvents: upcomingEvs }
    }

    return { filteredItems: out, filteredEvents: [] }
  }, [items, events, filter, q, sortBy])

  const isEmpty = filteredItems.length === 0 && filteredEvents.length === 0

  // ── Data oggi ─────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className={styles.page}>

      {/* ── Subheader ─────────────────────────────────────────────────── */}
      <div className={styles.subheader}>
        <div className={styles.subheaderInner}>
          <nav className={styles.breadcrumb}>
            <Link href="/dashboard" className={styles.bcLink}>dashboard</Link>
            <span>/</span>
            <span>newsroom</span>
          </nav>
          <h1 className={styles.pageTitle}>Comunicazione &amp; Eventi</h1>
        </div>
      </div>

      <div className={styles.inner}>

        {/* ── Hero con data ─────────────────────────────────────────── */}
        <div className={styles.hero}>
          <div className={styles.heroText}>
            <h2 className={styles.heroTitle}>
              In evidenza oggi,<br/>
              <span className={styles.heroDate}>{today}</span>
            </h2>
            <p className={styles.heroDesc}>
              Controlla sempre le comunicazioni per restare aggiornato sulle novità ed eventi
            </p>
          </div>
          <div className={styles.heroDecoShape} />
        </div>

        {/* ── KPI come filtri ─────────────────────────────────────────── */}
        <div className={styles.kpiRow}>

          {/* 1. Comunicati da leggere */}
          <button
            className={[styles.kpiCard, filter === 'UNREAD' ? styles.kpiCardActive : ''].join(' ')}
            onClick={() => setFilter(f => f === 'UNREAD' ? 'ALL' : 'UNREAD')}
          >
            <div className={styles.kpiTop}>
              <span className={styles.kpiLabel}>Comunicati da leggere</span>
              <span className={styles.kpiIco} style={{ color: '#E63329' }}>
                <svg viewBox="0 0 20 20" fill="none" width={18} height={18}>
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 10h6M10 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <span className={styles.kpiDot} style={{ background: '#E63329' }} />
            </div>
            <div className={styles.kpiVal}>
              <span className={styles.kpiNum}>{stats.unread}</span>
              <span className={styles.kpiSub}>non letti</span>
            </div>
          </button>

          {/* 2. Comunicati in primo piano */}
          <button
            className={[styles.kpiCard, filter === 'PINNED' ? styles.kpiCardActive : ''].join(' ')}
            onClick={() => setFilter(f => f === 'PINNED' ? 'ALL' : 'PINNED')}
          >
            <div className={styles.kpiTop}>
              <span className={styles.kpiLabel}>Comunicati in primo piano</span>
              <span className={styles.kpiIco} style={{ color: '#D97706' }}>
                <svg viewBox="0 0 20 20" fill="none" width={18} height={18}>
                  <path d="M4 4h12v10H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M8 8h4M8 11h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </span>
              <span className={styles.kpiDot} style={{ background: '#D97706' }} />
            </div>
            <div className={styles.kpiVal}>
              <span className={styles.kpiNum}>{stats.pinned}</span>
              <span className={styles.kpiSub}>in evidenza</span>
            </div>
          </button>

          {/* 3. Webinar e eventi → filtra inline (non più redirect) */}
          <button
            className={[styles.kpiCard, filter === 'EVENTS' ? styles.kpiCardActive : ''].join(' ')}
            onClick={() => setFilter(f => f === 'EVENTS' ? 'ALL' : 'EVENTS')}
          >
            <div className={styles.kpiTop}>
              <span className={styles.kpiLabel}>Webinar e eventi</span>
              <span className={styles.kpiIco} style={{ color: '#059669' }}>
                <svg viewBox="0 0 20 20" fill="none" width={18} height={18}>
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <span className={styles.kpiDot} style={{ background: '#059669' }} />
            </div>
            <div className={styles.kpiVal}>
              <span className={styles.kpiNum}>{stats.webinar}</span>
              <span className={styles.kpiSub}>in programma</span>
            </div>
          </button>

          {/* 4. Totale comunicazioni */}
          <button
            className={[styles.kpiCard, filter === 'ALL' && !q ? styles.kpiCardActive : ''].join(' ')}
            onClick={() => { setFilter('ALL'); setQ('') }}
          >
            <div className={styles.kpiTop}>
              <span className={styles.kpiLabel}>Totale comunicazioni</span>
              <span className={styles.kpiIco} style={{ color: '#067DB8' }}>
                <svg viewBox="0 0 20 20" fill="none" width={18} height={18}>
                  <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </span>
              <span className={styles.kpiDot} style={{ background: '#067DB8' }} />
            </div>
            <div className={styles.kpiVal}>
              <span className={styles.kpiNum}>{stats.total}</span>
              <span className={styles.kpiSub}>disponibili</span>
            </div>
          </button>
        </div>

        {/* ── Toolbar ricerca + ordinamento (nascosta in modalità EVENTS) */}
        {filter !== 'EVENTS' && (
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <svg viewBox="0 0 20 20" fill="none" width={15} height={15}>
                <circle cx="9" cy="9" r="6" stroke="var(--muted,#888)" strokeWidth="1.4"/>
                <path d="M14 14l3 3" stroke="var(--muted,#888)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input
                className={styles.searchInput}
                placeholder="Cerca comunicazione…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
              {q && (
                <button className={styles.searchClear} onClick={() => setQ('')}>
                  <svg viewBox="0 0 12 12" fill="none" width={11} height={11}>
                    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
            <div className={styles.sortBox}>
              <span className={styles.sortLabel}>Ordina per</span>
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'date' | 'type')}
              >
                <option value="date">più recente</option>
                <option value="type">tipo</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Intestazione sezione eventi (solo in modalità EVENTS) */}
        {filter === 'EVENTS' && (
          <div className={styles.eventsSectionBar}>
            <h2 className={styles.eventsSectionBarTitle}>Prossimi eventi e webinar</h2>
            <button
              className={styles.eventsSectionBarReset}
              onClick={() => setFilter('ALL')}
            >
              ← Tutte le comunicazioni
            </button>
          </div>
        )}

        {/* ── Lista comunicazioni + eventi ──────────────────────────────── */}
        {loading ? (
          <div className={styles.skeletonGrid}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className={styles.skeletonCard} style={{ animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        ) : isEmpty ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <p className={styles.emptyText}>
              {filter === 'EVENTS'
                ? 'Nessun evento in programma.'
                : 'Nessuna comunicazione trovata.'}
            </p>
            {(filter !== 'ALL' || q) && (
              <button className={styles.emptyReset} onClick={() => { setFilter('ALL'); setQ('') }}>
                Mostra tutte
              </button>
            )}
          </div>
        ) : (
          <div className={styles.annGrid}>
            {/* Comunicazioni */}
            {filteredItems.map(item => (
              <AnnCard key={`ann-${item.id}`} item={item} onClick={() => setSelected(item)} />
            ))}
            {/* Card evento */}
            {filteredEvents.map(ev => (
              <EventCard key={`ev-${ev.id}`} ev={ev} />
            ))}
          </div>
        )}

      </div>

      {/* ── Modal comunicazione ──────────────────────────────────────── */}
      {selected && (
        <AnnouncementModal item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
