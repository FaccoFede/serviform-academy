import Link from 'next/link'
import { getBrand, LEVEL_COLORS, DbSoftware } from '@/lib/brands'
import styles from './CourseCard.module.css'

export type CourseState = 'ACTIVE' | 'VISIBLE_LOCKED' | 'EXPIRED' | 'HIDDEN'

interface CourseCardProps {
  slug: string
  title: string
  description?: string
  softwareSlug: string
  /** Software object dal DB — quando presente, name/color/tagline dal DB prevalgono sui default */
  software?: DbSoftware | null
  level?: string
  duration?: string
  unitCount?: number
  state?: CourseState
  expiryLabel?: string | null
}

export default function CourseCard({
  slug,
  title,
  description,
  softwareSlug,
  software,
  level,
  duration,
  unitCount,
  state = 'VISIBLE_LOCKED',
  expiryLabel,
}: CourseCardProps) {
  const brand = getBrand(softwareSlug, software)
  const isActive = state === 'ACTIVE'
  const isExpired = state === 'EXPIRED'
  const isLocked = state === 'VISIBLE_LOCKED' || isExpired

  return (
    <Link
      href={isActive ? '/courses/' + slug : '#'}
      className={[styles.card, isLocked ? styles.cardLocked : ''].filter(Boolean).join(' ')}
      style={{ '--sw-color': brand.color, '--sw-light': brand.light } as React.CSSProperties}
      aria-disabled={isLocked}
      onClick={isLocked ? (e) => e.preventDefault() : undefined}
    >
      <div className={styles.topLine} />
      <span className={styles.tag} style={{ background: brand.light, color: brand.color }}>
        {brand.name}
      </span>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.desc}>{description}</p>}
      <div className={styles.meta}>
        {duration && <span className={styles.metaItem}>{duration}</span>}
        {unitCount != null && <span className={styles.metaItem}>{unitCount} unità</span>}
        {level && (
          <span className={styles.metaItem} style={{ color: LEVEL_COLORS[level] || 'var(--muted)' }}>
            {level}
          </span>
        )}

        {/* CTA contestuale per stato */}
        {isActive && (
          <span className={styles.cta}>
            inizia <span className={styles.arrow}>→</span>
          </span>
        )}
        {isExpired && (
          <span className={styles.expired}>
            <svg viewBox="0 0 14 14" fill="none" width={12} height={12}>
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            scaduto {expiryLabel ? `· ${expiryLabel}` : ''}
          </span>
        )}
        {state === 'VISIBLE_LOCKED' && (
          <span className={styles.locked}>
            <svg viewBox="0 0 14 14" fill="none" width={12} height={12}>
              <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            richiedi accesso
          </span>
        )}
      </div>
    </Link>
  )
}
