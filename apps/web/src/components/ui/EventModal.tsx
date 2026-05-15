'use client'
import { useEffect } from 'react'
import styles from './AnnouncementModal.module.css'

const EV_TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  WEBINAR:      { label: 'Webinar',       color: '#059669', bg: '#E6F7F2' },
  WORKSHOP:     { label: 'Workshop',      color: '#D97706', bg: '#FEF3CD' },
  LIVE_SESSION: { label: 'Sessione live', color: '#059669', bg: '#E6F7F2' },
  EVENTO:       { label: 'Evento',        color: '#059669', bg: '#E6F7F2' },
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('it-IT', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatTime(d: string) {
  if (!d) return ''
  const t = new Date(d).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  return t !== '00:00' ? t : ''
}

interface Props {
  item: any
  onClose: () => void
}

export default function EventModal({ item, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!item) return null

  const meta = EV_TYPE_META[item.eventType] || { label: item.eventType || 'Evento', color: '#059669', bg: '#E6F7F2' }
  const time = formatTime(item.date)

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
            {item.location && (
              <span className={styles.pinBadge} style={{ color: '#6B7280', background: '#F3F4F6' }}>
                <svg viewBox="0 0 14 14" fill="none" width={11} height={11}>
                  <path d="M7 1a4 4 0 010 8C4.5 9 2 6.5 2 5a5 5 0 0110 0c0 1.5-2.5 4-5 4z"
                    stroke="currentColor" strokeWidth="1.2"/>
                  <circle cx="7" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                {item.location}
              </span>
            )}
            <span className={styles.date}>
              {formatDate(item.date)}{time ? ` · ${time}` : ''}
            </span>
          </div>

          <h2 className={styles.title}>{item.title}</h2>

          {item.description && !item.content && (
            <p className={styles.lead}>{item.description}</p>
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
