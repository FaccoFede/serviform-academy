'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import styles from './Calendar.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const TYPE_LABELS: Record<string, string> = {
  WORKSHOP: 'Workshop', WEBINAR: 'Webinar', LIVE_SESSION: 'Sessione live',
}
const TYPE_COLORS: Record<string, string> = {
  WORKSHOP: '#067DB8', WEBINAR: '#059669', LIVE_SESSION: '#7C3AED',
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}
function formatFullDate(d: string) {
  return new Date(d).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Griglia calendario mensile ────────────────────────────────────────────
function CalendarGrid({
  year,
  month,
  events,
  selectedDay,
  onDaySelect,
}: {
  year: number
  month: number
  events: any[]
  selectedDay: number | null
  onDaySelect: (day: number) => void
}) {
  const today     = new Date()
  const firstDay  = new Date(year, month, 1).getDay()
  const daysCount = new Date(year, month + 1, 0).getDate()
  const offset    = (firstDay + 6) % 7  // lunedì = 0
  const cells     = Array.from({ length: offset + daysCount }, (_, i) =>
    i < offset ? null : i - offset + 1
  )

  // Mappa giorno → eventi
  const eventsByDay = useMemo(() => {
    const m: Record<number, any[]> = {}
    events.forEach(ev => {
      const d = new Date(ev.date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!m[day]) m[day] = []
        m[day].push(ev)
      }
    })
    return m
  }, [events, year, month])

  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear()

  return (
    <div className={styles.gridWrap}>
      {/* Intestazioni giorno */}
      {['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(d => (
        <div key={d} className={styles.gridDayLabel}>{d}</div>
      ))}

      {/* Celle */}
      {cells.map((day, i) => {
        if (day === null) {
          return <div key={`e${i}`} className={styles.gridCellEmpty} />
        }
        const dayEvents  = eventsByDay[day] || []
        const isSelected = day === selectedDay
        const isTdy      = isToday(day)
        return (
          <button
            key={day}
            className={[
              styles.gridCell,
              isTdy      ? styles.gridCellToday    : '',
              isSelected ? styles.gridCellSelected : '',
              dayEvents.length > 0 ? styles.gridCellHasEvents : '',
            ].join(' ')}
            onClick={() => onDaySelect(day)}
          >
            <span className={styles.gridCellNum}>{day}</span>
            {/* Dots evento (max 3 dot) */}
            {dayEvents.length > 0 && (
              <div className={styles.gridDots}>
                {dayEvents.slice(0, 3).map((ev, di) => (
                  <span
                    key={di}
                    className={styles.gridDot}
                    style={{ background: TYPE_COLORS[ev.eventType] || '#888' }}
                  />
                ))}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Componente principale ─────────────────────────────────────────────────
export default function CalendarPage() {
  const { token } = useAuth()
  const [events,  setEvents]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const [year,        setYear]        = useState(now.getFullYear())
  const [month,       setMonth]       = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // ── Fetch tutti gli eventi ─────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/events`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setEvents(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Navigazione mese ───────────────────────────────────────────────
  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  // ── Eventi del mese corrente ───────────────────────────────────────
  const monthEvents = useMemo(() =>
    events
      .filter(ev => {
        const d = new Date(ev.date)
        return d.getFullYear() === year && d.getMonth() === month
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  [events, year, month])

  // ── Eventi del giorno selezionato (o del mese intero) ──────────────
  const displayedEvents = useMemo(() => {
    if (selectedDay === null) return monthEvents
    return monthEvents.filter(ev => new Date(ev.date).getDate() === selectedDay)
  }, [monthEvents, selectedDay])

  const monthLabel = new Date(year, month).toLocaleDateString('it-IT', {
    month: 'long', year: 'numeric',
  })

  const selectedDayLabel = selectedDay !== null
    ? new Date(year, month, selectedDay).toLocaleDateString('it-IT', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : null

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <nav className={styles.breadcrumb}>
            <Link href="/dashboard"  className={styles.bcLink}>dashboard</Link>
            <span>/</span>
            <Link href="/newsroom"   className={styles.bcLink}>newsroom</Link>
            <span>/</span>
            <span>calendario</span>
          </nav>
          <h1 className={styles.pageTitle}>Calendario eventi</h1>
          <p className={styles.pageDesc}>Workshop, webinar e sessioni live Serviform Academy</p>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.layout}>

          {/* ── Colonna principale: calendario ──────────────────────── */}
          <div className={styles.calWrap}>
            <div className={styles.calCard}>
              {/* Navigazione mese */}
              <div className={styles.calNav}>
                <button className={styles.calNavBtn} onClick={prevMonth} aria-label="Mese precedente">
                  <svg viewBox="0 0 14 14" fill="none" width={14} height={14}>
                    <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className={styles.calMonthRow}>
                  <span className={styles.calMonthLabel}>{monthLabel}</span>
                  {selectedDay !== null && (
                    <button
                      className={styles.calClearDay}
                      onClick={() => setSelectedDay(null)}
                    >
                      Mostra tutto il mese ×
                    </button>
                  )}
                </div>
                <button className={styles.calNavBtn} onClick={nextMonth} aria-label="Mese successivo">
                  <svg viewBox="0 0 14 14" fill="none" width={14} height={14}>
                    <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Griglia giorni */}
              <CalendarGrid
                year={year}
                month={month}
                events={events}
                selectedDay={selectedDay}
                onDaySelect={setSelectedDay}
              />

              {/* Legenda */}
              <div className={styles.legend}>
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <span key={key} className={styles.legendItem}>
                    <span
                      className={styles.legendDot}
                      style={{ background: TYPE_COLORS[key] || '#888' }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Colonna destra: lista eventi ────────────────────────── */}
          <div className={styles.eventsWrap}>
            <div className={styles.eventsHeader}>
              <h2 className={styles.eventsTitle}>
                {selectedDayLabel
                  ? selectedDayLabel
                  : `${monthEvents.length} event${monthEvents.length === 1 ? 'o' : 'i'} in ${monthLabel}`}
              </h2>
            </div>

            {loading ? (
              <div className={styles.eventsLoading}>
                {[1,2,3].map(i => (
                  <div key={i} className={styles.eventSkeleton} style={{ animationDelay: `${i*0.1}s` }} />
                ))}
              </div>
            ) : displayedEvents.length === 0 ? (
              <div className={styles.eventsEmpty}>
                <div className={styles.eventsEmptyIcon}>📅</div>
                <p className={styles.eventsEmptyText}>
                  {selectedDay !== null
                    ? 'Nessun evento in questo giorno.'
                    : 'Nessun evento in questo mese.'}
                </p>
              </div>
            ) : (
              <div className={styles.eventsList}>
                {displayedEvents.map(ev => {
                  const color = TYPE_COLORS[ev.eventType] || '#888'
                  const label = TYPE_LABELS[ev.eventType] || ev.eventType
                  const evDate = new Date(ev.date)
                  return (
                    <div key={ev.id} className={styles.eventCard}>
                      <div className={styles.eventCardAccent} style={{ background: color }} />
                      <div className={styles.eventCardContent}>
                        <div className={styles.eventCardMeta}>
                          <span
                            className={styles.eventCardType}
                            style={{ background: color + '18', color }}
                          >
                            {label}
                          </span>
                          <span className={styles.eventCardTime}>
                            {formatFullDate(ev.date)}
                            {' · '}
                            {formatTime(ev.date)}
                            {ev.endDate && ` – ${formatTime(ev.endDate)}`}
                          </span>
                        </div>
                        <h3 className={styles.eventCardTitle}>{ev.title}</h3>
                        {ev.description && (
                          <p className={styles.eventCardDesc}>{ev.description}</p>
                        )}
                        <div className={styles.eventCardFooter}>
                          {ev.location && (
                            <span className={styles.eventCardLocation}>
                              <svg viewBox="0 0 14 14" fill="none" width={12} height={12}>
                                <path d="M7 1a4 4 0 010 8C4.5 9 1 6 1 6s.5-1 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                <circle cx="7" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                              </svg>
                              {ev.location}
                            </span>
                          )}
                          {ev.maxSeats && (
                            <span className={styles.eventCardSeats}>
                              {ev.maxSeats} posti
                            </span>
                          )}
                          {ev.registrationUrl && (
                            <a
                              href={ev.registrationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.eventCardCta}
                            >
                              Iscriviti →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
