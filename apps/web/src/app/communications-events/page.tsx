'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import styles from './CommunicationsEvents.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const SECTIONS = [
  { key: 'ALL',         label: 'Tutte',            icon: 'M4 6h16M4 12h16M4 18h10' },
  { key: 'NEWS',        label: 'Novità',            icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'EVENTS',      label: 'Eventi',            icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'PRESS',       label: 'Comunicati',        icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9' },
  { key: 'RULES',       label: 'Regole',            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
] as const

type SectionKey = typeof SECTIONS[number]['key']

const SECTION_COLORS: Record<string, string> = {
  NEWS: '#067DB8', EVENTS: '#059669', PRESS: '#7C3AED', RULES: '#D97706',
  WEBINAR: '#059669', MAINTENANCE: '#D97706', NEW_COURSE: '#E63329',
}

function getSection(type: string): string {
  if (['EVENTS', 'WEBINAR', 'NEW_COURSE'].includes(type)) return 'EVENTS'
  if (type === 'PRESS' || type === 'MAINTENANCE') return 'PRESS'
  if (type === 'RULES') return 'RULES'
  return 'NEWS'
}

function SvgIcon({ path, size = 16 }: { path: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} style={{ flexShrink: 0 }}>
      <path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function AnnouncementCard({ item, onClick }: { item: any; onClick: () => void }) {
  const color = SECTION_COLORS[item.type] || 'var(--muted)'
  const section = getSection(item.type)
  const sectionLabel = SECTIONS.find(s => s.key === section)?.label || item.type
  const date = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  return (
    <article className={[styles.card, item.isPinned ? styles.cardPinned : ''].join(' ')} onClick={onClick} role="button" tabIndex={0}>
      {/* Banner immagine */}
      {item.bannerUrl ? (
        <div className={styles.cardBanner}>
          <img src={item.bannerUrl} alt={item.title} className={styles.cardBannerImg}/>
        </div>
      ) : (
        <div className={styles.cardBannerFallback} style={{ background: color + '18' }}>
          <SvgIcon path={SECTIONS.find(s => s.key === section)?.icon || SECTIONS[0].icon} size={28}/>
        </div>
      )}
      <div className={styles.cardAccent} style={{ background: color }}/>
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={styles.cardSection} style={{ color, background: color + '15' }}>
            {sectionLabel}
          </span>
          {item.isPinned && (
            <span className={styles.pinBadge}>
              <SvgIcon path="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" size={11}/>
              In primo piano
            </span>
          )}
          {date && <span className={styles.cardDate}>{date}</span>}
        </div>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardDesc}>{item.body}</p>
        <span className={styles.cardReadMore}>Leggi →</span>
      </div>
    </article>
  )
}

function ArticleModal({ item, onClose }: { item: any; onClose: () => void }) {
  const color = SECTION_COLORS[item.type] || 'var(--muted)'
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', handler) }
  }, [onClose])

  return (
    <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          {item.bannerUrl && (
            <div className={styles.modalBanner}>
              <img src={item.bannerUrl} alt={item.title} className={styles.modalBannerImg}/>
            </div>
          )}
          <button className={styles.modalClose} onClick={onClose}>
            <SvgIcon path="M6 18L18 6M6 6l12 12" size={18}/>
          </button>
          <div className={styles.modalHeaderContent} style={{ paddingTop: item.bannerUrl ? 20 : 0 }}>
            <div className={styles.cardMeta}>
              <span className={styles.cardSection} style={{ color, background: color + '15' }}>
                {SECTIONS.find(s => s.key === getSection(item.type))?.label || item.type}
              </span>
              {item.isPinned && <span className={styles.pinBadge}><SvgIcon path="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" size={11}/>In primo piano</span>}
              {item.publishedAt && (
                <span className={styles.cardDate}>
                  {new Date(item.publishedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>
            <h2 className={styles.modalTitle}>{item.title}</h2>
            <p className={styles.modalLead}>{item.body}</p>
          </div>
        </div>
        <div className={styles.modalBody}>
          {item.content ? (
            <div className={styles.articleContent} dangerouslySetInnerHTML={{ __html: item.content }}/>
          ) : (
            <p className={styles.modalNoContent}>Nessun contenuto aggiuntivo disponibile.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function CommunicationsInner() {
  const { token } = useAuth()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SectionKey>('ALL')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    const headers: any = {}
    if (token) headers['Authorization'] = 'Bearer ' + token
    const url = token ? `${API_URL}/announcements` : `${API_URL}/announcements/public`
    fetch(url, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(d => setItems(d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const filtered = useMemo(() => {
    let out = items
    if (activeSection !== 'ALL') {
      out = out.filter(a => getSection(a.type) === activeSection || a.section === activeSection)
    }
    if (q) {
      const ql = q.toLowerCase()
      out = out.filter(a => a.title.toLowerCase().includes(ql) || (a.body || '').toLowerCase().includes(ql))
    }
    return out
  }, [items, activeSection, q])

  const pinned = filtered.filter(a => a.isPinned)
  const unpinned = filtered.filter(a => !a.isPinned)

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <nav className={styles.breadcrumb}>
            <Link href="/dashboard" className={styles.bcLink}>Dashboard</Link>
            <SvgIcon path="M9 5l7 7-7 7" size={11}/>
            <span>Comunicazione &amp; Eventi</span>
          </nav>
          <h1 className={styles.pageTitle}>Comunicazione &amp; Eventi</h1>
          <p className={styles.pageSub}>Novità, eventi, comunicati e regole della piattaforma</p>
        </div>
      </div>

      {/* Filtri sezione */}
      <div className={styles.filterBar}>
        <div className={styles.filterBarInner}>
          {SECTIONS.map(s => (
            <button
              key={s.key}
              className={[styles.sectionBtn, activeSection === s.key ? styles.sectionBtnActive : ''].join(' ')}
              onClick={() => setActiveSection(s.key)}
            >
              <SvgIcon path={s.icon} size={13}/>
              {s.label}
              <span className={styles.sectionCount}>
                {s.key === 'ALL' ? items.length : items.filter(a => getSection(a.type) === s.key || a.section === s.key).length}
              </span>
            </button>
          ))}
          <div className={styles.searchBox}>
            <SvgIcon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={14}/>
            <input
              className={styles.searchInput}
              placeholder="Cerca..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            {q && <button className={styles.searchClear} onClick={() => setQ('')}>
              <SvgIcon path="M6 18L18 6M6 6l12 12" size={12}/>
            </button>}
          </div>
        </div>
      </div>

      <div className={styles.inner}>
        {loading ? (
          <div className={styles.loadGrid}>
            {[1,2,3,4,5,6].map(i => <div key={i} className={styles.loadCard} style={{ animationDelay: `${i*0.08}s` }}/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <SvgIcon path="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={40}/>
            </div>
            <h3>Nessun contenuto trovato</h3>
            <p>Prova a modificare i filtri o la ricerca.</p>
            {(activeSection !== 'ALL' || q) && (
              <button className={styles.emptyReset} onClick={() => { setActiveSection('ALL'); setQ('') }}>
                Rimuovi filtri
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Pinned */}
            {pinned.length > 0 && (
              <section className={styles.pinnedSection}>
                <div className={styles.pinnedLabel}>
                  <SvgIcon path="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" size={13}/>
                  In primo piano
                </div>
                <div className={styles.pinnedGrid}>
                  {pinned.map(a => <AnnouncementCard key={a.id} item={a} onClick={() => setSelected(a)}/>)}
                </div>
              </section>
            )}
            {/* Rest */}
            <div className={styles.cardGrid}>
              {unpinned.map(a => <AnnouncementCard key={a.id} item={a} onClick={() => setSelected(a)}/>)}
            </div>
          </>
        )}
      </div>

      {selected && <ArticleModal item={selected} onClose={() => setSelected(null)}/>}
    </div>
  )
}

export default function CommunicationsEventsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'var(--muted)' }}>Caricamento...</div>}>
      <CommunicationsInner/>
    </Suspense>
  )
}
