'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import styles from './CommunicationsPage.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  NEWS:        { label: 'Novità',       color: '#067DB8', bg: '#E3F4FC', icon: '📰' },
  NEW_COURSE:  { label: 'Nuovo corso',  color: '#E63329', bg: '#FFF1F0', icon: '🎓' },
  WEBINAR:     { label: 'Webinar',      color: '#059669', bg: '#EDFAF3', icon: '🎙' },
  MAINTENANCE: { label: 'Manutenzione', color: '#D97706', bg: '#FAEEDA', icon: '🔧' },
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
}

interface Announcement {
  id: string
  title: string
  body: string
  type: string
  publishedAt?: string
  createdAt: string
  isPinned: boolean
  bannerUrl?: string
  content?: string
}

function AnnCard({ a, onClick }: { a: Announcement; onClick: () => void }) {
  const meta = TYPE_META[a.type] || { label: a.type, color: '#888', bg: '#f5f5f5', icon: '📄' }
  return (
    <button className={styles.card} onClick={onClick}>
      {/* Banner */}
      <div className={styles.cardBanner} style={{ background: meta.bg }}>
        {a.bannerUrl
          ? <img src={a.bannerUrl} alt="" className={styles.bannerImg} />
          : <span className={styles.bannerIcon}>{meta.icon}</span>
        }
        {a.isPinned && <span className={styles.pinBadge}>📌 In evidenza</span>}
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={styles.typeBadge} style={{ background: meta.bg, color: meta.color }}>
            {meta.label}
          </span>
          <span className={styles.date}>{formatDate(a.publishedAt || a.createdAt)}</span>
        </div>
        <h3 className={styles.cardTitle}>{a.title}</h3>
        {a.body && (
          <p className={styles.cardExcerpt}>
            {a.body.slice(0, 160)}{a.body.length > 160 ? '…' : ''}
          </p>
        )}
        <span className={styles.readMore}>Leggi →</span>
      </div>
    </button>
  )
}

function DetailModal({ a, onClose }: { a: Announcement; onClose: () => void }) {
  const meta = TYPE_META[a.type] || { label: a.type, color: '#888', bg: '#f5f5f5', icon: '📄' }

  // chiudi con ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Chiudi">×</button>

        {a.bannerUrl && (
          <img src={a.bannerUrl} alt="" className={styles.modalBanner} />
        )}

        <div className={styles.modalContent}>
          <div className={styles.modalMeta}>
            <span className={styles.typeBadge} style={{ background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
            <span className={styles.date}>{formatDate(a.publishedAt || a.createdAt)}</span>
          </div>
          <h2 className={styles.modalTitle}>{a.title}</h2>
          {a.content
            ? <div className={styles.modalBody} dangerouslySetInnerHTML={{ __html: a.content }} />
            : <p className={styles.modalBody}>{a.body}</p>
          }
        </div>
      </div>
    </div>
  )
}

export default function CommunicationsPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Announcement | null>(null)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = 'Bearer ' + token
    fetch(API_URL + '/announcements', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const types = ['ALL', ...Array.from(new Set(items.map(i => i.type)))]
  const filtered = filter === 'ALL' ? items : items.filter(i => i.type === filter)
  const pinned = filtered.filter(i => i.isPinned)
  const regular = filtered.filter(i => !i.isPinned)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/dashboard" className={styles.back}>← Dashboard</Link>
          <h1 className={styles.title}>Comunicazioni</h1>
          <p className={styles.desc}>Novità, aggiornamenti e annunci dalla piattaforma</p>
        </div>
      </div>

      {/* Filter tabs */}
      {types.length > 1 && (
        <div className={styles.filters}>
          {types.map(t => (
            <button
              key={t}
              className={[styles.filterBtn, filter === t ? styles.filterActive : ''].join(' ')}
              onClick={() => setFilter(t)}
            >
              {t === 'ALL' ? 'Tutte' : (TYPE_META[t]?.label || t)}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className={styles.grid}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 0.06}s` }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <p>Nessuna comunicazione al momento.</p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>In evidenza</h2>
              <div className={styles.grid}>
                {pinned.map(a => <AnnCard key={a.id} a={a} onClick={() => setSelected(a)} />)}
              </div>
            </section>
          )}
          {regular.length > 0 && (
            <section className={styles.section}>
              {pinned.length > 0 && <h2 className={styles.sectionTitle}>Tutte le comunicazioni</h2>}
              <div className={styles.grid}>
                {regular.map(a => <AnnCard key={a.id} a={a} onClick={() => setSelected(a)} />)}
              </div>
            </section>
          )}
        </>
      )}

      {selected && <DetailModal a={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
