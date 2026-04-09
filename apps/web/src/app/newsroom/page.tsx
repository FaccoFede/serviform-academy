'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AnnouncementModal from '@/components/ui/AnnouncementModal'
import styles from './Newsroom.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// ── Metadati tipo comunicazione ───────────────────────────────────────────
const TYPE_META: Record<string, { label: string; color: string }> = {
  NEWS:        { label: 'Novità',       color: '#067DB8' },
  NEW_COURSE:  { label: 'Nuovo corso',  color: '#E63329' },
  WEBINAR:     { label: 'Webinar',      color: '#059669' },
  MAINTENANCE: { label: 'Manutenzione', color: '#D97706' },
  EVENTS:      { label: 'Evento',       color: '#059669' },
  PRESS:       { label: 'Comunicato',   color: '#7C3AED' },
  RULES:       { label: 'Regola',       color: '#D97706' },
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateShort(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short',
  })
}

// ── Tipo filtro attivo ────────────────────────────────────────────────────
type FilterKey = 'ALL' | 'UNREAD' | 'PINNED'

// ── Card singola comunicazione ────────────────────────────────────────────
function AnnCard({ item, onClick }: { item: any; onClick: () => void }) {
  const meta  = TYPE_META[item.type] || { label: item.type, color: '#888' }
  const bg    = meta.color + '18'

  return (
    <button className={styles.annCard} onClick={onClick}>
      {/* Immagine: se presente mostrala, altrimenti placeholder stesso aspect-ratio */}
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

// ── Calendario mini inline ────────────────────────────────────────────────
function MiniCalendar({
  year, month, eventDays, onDayClick, selectedDay,
}: {
  year: number
  month: number
  eventDays: Set<number>
  onDayClick: (day: number) => void
  selectedDay: number | null
}) {
  const firstDay  = new Date(year, month, 1).getDay()
  const daysCount = new Date(year, month + 1, 0).getDate()
  // Lunedì primo (0=lun … 6=dom)
  const offset    = (firstDay + 6) % 7
  const cells     = Array.from({ length: offset + daysCount }, (_, i) =>
    i < offset ? null : i - offset + 1
  )

  return (
    <div className={styles.calGrid}>
      {['L','M','M','G','V','S','D'].map((d, i) => (
        <span key={i} className={styles.calDayLabel}>{d}</span>
      ))}
      {cells.map((day, i) => (
        <button
          key={i}
          className={[
            styles.calDayCell,
            day === null           ? styles.calDayEmpty    : '',
            day !== null && eventDays.has(day) ? styles.calDayEvent    : '',
            day !== null && day === selectedDay ? styles.calDaySelected : '',
          ].join(' ')}
          onClick={() => day !== null && onDayClick(day)}
          disabled={day === null}
        >
          {day ?? ''}
        </button>
      ))}
    </div>
  )
}

// ── Componente principale ─────────────────────────────────────────────────
export default function NewsroomPage() {
  const { token }   = useAuth()
  const router      = useRouter()

  const [items,       setItems]       = useState<any[]>([])
  const [events,      setEvents]      = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState<FilterKey>('ALL')
  const [q,           setQ]           = useState('')
  const [sortBy,      setSortBy]      = useState<'date' | 'type'>('date')
  const [selected,    setSelected]    = useState<any>(null)
  // Calendario
  const now          = new Date()
  const [calYear,    setCalYear]      = useState(now.getFullYear())
  const [calMonth,   setCalMonth]     = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // ── Fetch comunicazioni ─────────────────────────────────────────────
  useEffect(() => {
    const headers: any = {}
    if (token) headers['Authorization'] = 'Bearer ' + token
    const url = token
      ? `${API_URL}/announcements`
      : `${API_URL}/announcements/public`
    fetch(url, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(d => setItems(d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  // ── Fetch eventi ────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/events`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setEvents(d || []))
      .catch(() => {})
  }, [])

  // ── Statistiche KPI ─────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:   items.length,
    unread:  items.filter(a => !a.read).length,
    pinned:  items.filter(a => a.isPinned).length,
    webinar: events.filter(e => {
      const d = new Date(e.date)
      return d >= new Date()
    }).length,
  }), [items, events])

  // ── Lista filtrata ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
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
    return out
  }, [items, filter, q, sortBy])

  // ── Giorni con eventi nel mese selezionato ─────────────────────────
  const eventDays = useMemo(() => {
    const s = new Set<number>()
    events.forEach(e => {
      const d = new Date(e.date)
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        s.add(d.getDate())
      }
    })
    return s
  }, [events, calYear, calMonth])

  // ── Prossimi eventi (tutti i futuri, max 6) ──────────────────────
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return events
      .filter(e => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 6)
  }, [events])

  // ── Mese corrente navigazione ─────────────────────────────────────
  const monthLabel = new Date(calYear, calMonth).toLocaleDateString('it-IT', {
    month: 'long', year: 'numeric',
  })

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
    setSelectedDay(null)
  }

  // ── Data oggi ─────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const TYPE_LABELS_EVENT: Record<string, string> = {
    WORKSHOP: 'Workshop', WEBINAR: 'Webinar', LIVE_SESSION: 'Sessione live',
  }

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

          {/* 1. Comunicati da leggere → filtra non letti */}
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

          {/* 2. Comunicati in primo piano → filtra isPinned */}
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

          {/* 3. Webinar e eventi → redirect /calendar */}
          <button
            className={styles.kpiCard}
            onClick={() => router.push('/calendar')}
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
              <span className={styles.kpiSub}>in calendario</span>
            </div>
          </button>

          {/* 4. Totale comunicazioni → rimuove filtri */}
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

        {/* ── Toolbar ricerca + ordinamento ──────────────────────────── */}
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

        {/* ── Lista comunicazioni ─────────────────────────────────────── */}
        {loading ? (
          <div className={styles.skeletonGrid}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className={styles.skeletonCard} style={{ animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <p className={styles.emptyText}>Nessuna comunicazione trovata.</p>
            {(filter !== 'ALL' || q) && (
              <button className={styles.emptyReset} onClick={() => { setFilter('ALL'); setQ('') }}>
                Mostra tutte
              </button>
            )}
          </div>
        ) : (
          <div className={styles.annGrid}>
            {filtered.map(item => (
              <AnnCard key={item.id} item={item} onClick={() => setSelected(item)} />
            ))}
          </div>
        )}

        {/* ── Sezione calendario ed eventi ────────────────────────────── */}
        <div className={styles.calSection}>

          {/* Colonna sinistra — Calendario */}
          <div className={styles.calCol}>
            <div className={styles.calHeader}>
              <button className={styles.calNavBtn} onClick={prevMonth} aria-label="Mese precedente">
                <svg viewBox="0 0 14 14" fill="none" width={14} height={14}>
                  <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span className={styles.calMonthLabel}>{monthLabel}</span>
              <button className={styles.calNavBtn} onClick={nextMonth} aria-label="Mese successivo">
                <svg viewBox="0 0 14 14" fill="none" width={14} height={14}>
                  <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <MiniCalendar
              year={calYear}
              month={calMonth}
              eventDays={eventDays}
              onDayClick={setSelectedDay}
              selectedDay={selectedDay}
            />
            <div className={styles.calLegend}>
              <span className={styles.calLegendDot} />
              <span className={styles.calLegendText}>Giorno con evento</span>
            </div>
          </div>

          {/* Colonna destra — Prossimi eventi */}
          <div className={styles.eventsCol}>
            <div className={styles.eventsSectionHeader}>
              <h3 className={styles.eventsSectionTitle}>Prossimi eventi</h3>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className={styles.eventsEmpty}>Nessun evento in programma.</div>
            ) : (
              <div className={styles.eventsList}>
                {upcomingEvents.map(ev => (
                  <div key={ev.id} className={styles.eventCard}>
                    <div className={styles.eventCardDate}>
                      <span className={styles.eventCardDay}>
                        {new Date(ev.date).toLocaleDateString('it-IT', { day: '2-digit' })}
                      </span>
                      <span className={styles.eventCardMonth}>
                        {new Date(ev.date).toLocaleDateString('it-IT', { month: 'short' })}
                      </span>
                    </div>
                    <div className={styles.eventCardBody}>
                      <span className={styles.eventCardType}>
                        {TYPE_LABELS_EVENT[ev.eventType] || ev.eventType}
                      </span>
                      <div className={styles.eventCardTitle}>{ev.title}</div>
                      {ev.location && (
                        <div className={styles.eventCardLocation}>{ev.location}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link href="/calendar" className={styles.allEventsLink}>
              Tutti gli eventi →
            </Link>
          </div>
        </div>

      </div>

      {/* ── Modal comunicazione ──────────────────────────────────────── */}
      {selected && (
        <AnnouncementModal item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
