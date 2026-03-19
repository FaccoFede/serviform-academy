import Link from 'next/link'
import { getBrand, LEVEL_COLORS } from '@/lib/brands'
import SoftwareTag from './SoftwareTag'
import styles from './CourseCard.module.css'

/**
 * CourseCard — card per la griglia dei corsi.
 *
 * Mostra: tag software, titolo, descrizione, metadata (durata, unità, livello)
 * e un CTA per avviare il corso o un badge "In arrivo" se non disponibile.
 *
 * Il bordo superiore si colora al hover con il colore del software.
 */
interface CourseCardProps {
  slug: string
  title: string
  description?: string
  softwareSlug: string
  duration?: string
  unitCount?: number
  level?: string
  available?: boolean
}

export default function CourseCard({
  slug,
  title,
  description,
  softwareSlug,
  duration,
  unitCount,
  level,
  available = true,
}: CourseCardProps) {
  const brand = getBrand(softwareSlug)
  const levelColor = level ? LEVEL_COLORS[level] || '#6B6B6B' : '#6B6B6B'

  const cardContent = (
    <div
      className={styles.card}
      style={{ '--card-color': brand.color } as React.CSSProperties}
    >
      {/* Header */}
      <div className={styles.header}>
        <SoftwareTag slug={softwareSlug} />
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.desc}>{description}</p>}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.meta}>
          {duration && (
            <span className={styles.metaItem}>
              <svg viewBox="0 0 12 12" fill="none" width={12} height={12}>
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
                <path d="M6 4v2l1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              {duration}
            </span>
          )}
          {unitCount !== undefined && (
            <span className={styles.metaItem}>
              <svg viewBox="0 0 12 12" fill="none" width={12} height={12}>
                <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1" />
                <path d="M1 4h10" stroke="currentColor" strokeWidth="1" />
              </svg>
              {unitCount} unità
            </span>
          )}
          {level && (
            <span className={styles.metaItem} style={{ color: levelColor }}>
              ● {level}
            </span>
          )}
        </div>

        {available ? (
          <span className={styles.ctaAvailable}>Inizia →</span>
        ) : (
          <span className={styles.locked}>🔒 In arrivo</span>
        )}
      </div>
    </div>
  )

  if (available) {
    return (
      <Link href={`/courses/${slug}`} className={styles.link}>
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
