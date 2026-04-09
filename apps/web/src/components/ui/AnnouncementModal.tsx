'use client'
import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import styles from './AnnouncementModal.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  NEWS:        { label: 'Novità',       color: '#067DB8', bg: '#E8F4FB' },
  NEW_COURSE:  { label: 'Nuovo corso',  color: '#E63329', bg: '#FEECEB' },
  WEBINAR:     { label: 'Webinar',      color: '#059669', bg: '#E6F7F2' },
  MAINTENANCE: { label: 'Manutenzione', color: '#D97706', bg: '#FEF3CD' },
  EVENTS:      { label: 'Evento',       color: '#059669', bg: '#E6F7F2' },
  PRESS:       { label: 'Comunicato',   color: '#7C3AED', bg: '#F3EEFF' },
  RULES:       { label: 'Regola',       color: '#D97706', bg: '#FEF3CD' },
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

interface Props {
  item: any
  onClose: () => void
}

export default function AnnouncementModal({ item, onClose }: Props) {
  const { token } = useAuth()
  const meta = TYPE_META[item?.type] || { label: item?.type || '', color: '#888', bg: '#f5f5f5' }

  // ── Segna come letta al momento dell'apertura ─────────────────────────
  useEffect(() => {
    if (!token || !item?.id) return
    fetch(`${API_URL}/announcements/${item.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + token },
    }).catch(() => {})
  }, [item?.id, token])

  // ── Chiudi con ESC ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!item) return null

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <button className={styles.closeBtn} onClick={onClose} aria-label="Chiudi">
          <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>

        {item.bannerUrl && (
          <div className={styles.bannerWrap}>
            <img src={item.bannerUrl} alt="" className={styles.bannerImg} />
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.meta}>
            <span className={styles.typeBadge} style={{ background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
            {item.isPinned && (
              <span className={styles.pinBadge}>
                <svg viewBox="0 0 14 14" fill="none" width={11} height={11}>
                  <path d="M5 2a2 2 0 012-2h0a2 2 0 012 2v9l-2-1-2 1V2z"
                    stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
                In primo piano
              </span>
            )}
            <span className={styles.date}>
              {formatDate(item.publishedAt || item.createdAt)}
            </span>
          </div>

          <h2 className={styles.title}>{item.title}</h2>

          {item.body && !item.content && (
            <p className={styles.lead}>{item.body}</p>
          )}

          {item.content && (
            <div
              className={styles.body}
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
