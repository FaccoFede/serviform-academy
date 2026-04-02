'use client'
import Link from 'next/link'
import styles from './CourseProgressCard.module.css'

interface Props {
  slug: string
  title: string
  softwareName: string
  softwareColor: string
  softwareLight: string
  level?: string
  duration?: string
  publishState?: string
  thumbnailUrl?: string
  percent: number
  completed: number
  total: number
  lastViewedUnitSlug?: string
  expiresAt?: string | null
}

const LEVEL_COLOR: Record<string, string> = {
  Base: '#059669',
  Intermedio: '#D97706',
  Avanzato: '#E63329',
}

const STATE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  PUBLISHED: { label: 'Attivo', bg: '#EDFAF3', color: '#2D6A4F' },
  VISIBLE_LOCKED: { label: 'Bloccato', bg: '#FFF1F0', color: '#E63329' },
  HIDDEN: { label: 'Nascosto', bg: '#F1EFE8', color: '#5F5E5A' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CourseProgressCard({
  slug, title, softwareName, softwareColor, softwareLight,
  level, duration, publishState = 'PUBLISHED', thumbnailUrl,
  percent, completed, total, lastViewedUnitSlug, expiresAt,
}: Props) {
  const state = STATE_BADGE[publishState] || STATE_BADGE.PUBLISHED
  const isLocked = publishState === 'VISIBLE_LOCKED'
  const resumeHref = lastViewedUnitSlug
    ? `/courses/${slug}/${lastViewedUnitSlug}`
    : `/courses/${slug}`

  return (
    <Link
      href={isLocked ? `/courses/${slug}` : resumeHref}
      className={[styles.card, isLocked ? styles.locked : ''].join(' ')}
    >
      {/* Thumbnail */}
      <div className={styles.thumb} style={{ background: softwareLight }}>
        {thumbnailUrl
          ? <img src={thumbnailUrl} alt={title} className={styles.thumbImg} />
          : (
            <div className={styles.thumbPlaceholder} style={{ color: softwareColor }}>
              <svg viewBox="0 0 24 24" fill="none" width={28} height={28}>
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          )
        }
        {isLocked && (
          <div className={styles.lockOverlay}>
            <svg viewBox="0 0 16 16" fill="none" width={16} height={16}>
              <rect x="2" y="7" width="12" height="9" rx="2" stroke="white" strokeWidth="1.2"/>
              <path d="M5 7V5a3 3 0 016 0v2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Header */}
        <div className={styles.meta}>
          <span className={styles.softwareTag} style={{ background: softwareLight, color: softwareColor }}>
            {softwareName}
          </span>
          <span className={styles.stateBadge} style={{ background: state.bg, color: state.color }}>
            {state.label}
          </span>
        </div>

        <h3 className={styles.title}>{title}</h3>

        {/* Details row */}
        <div className={styles.details}>
          {level && (
            <span className={styles.detail} style={{ color: LEVEL_COLOR[level] || 'var(--muted)' }}>
              {level}
            </span>
          )}
          {duration && <span className={styles.detail}>⏱ {duration}</span>}
          {total > 0 && <span className={styles.detail}>📋 {total} unità</span>}
        </div>

        {/* Progress */}
        {total > 0 && !isLocked && (
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${percent}%`,
                  background: percent === 100 ? '#059669' : softwareColor,
                }}
              />
            </div>
            <div className={styles.progressLabel}>
              {percent === 100
                ? <span className={styles.done}>✓ Completato</span>
                : <span>{percent}% · {completed}/{total}</span>
              }
            </div>
          </div>
        )}

        {/* Scadenza */}
        {expiresAt && !isLocked && (
          <div className={styles.expiry}>
            Scade: {formatDate(expiresAt)}
          </div>
        )}

        {/* CTA */}
        <div className={styles.cta}>
          {isLocked
            ? <span className={styles.ctaLocked}>Accesso non attivo</span>
            : percent === 100
            ? <span className={styles.ctaDone}>Rivedi il corso →</span>
            : percent > 0
            ? <span className={styles.ctaResume}>Continua →</span>
            : <span className={styles.ctaStart}>Inizia →</span>
          }
        </div>
      </div>
    </Link>
  )
}
