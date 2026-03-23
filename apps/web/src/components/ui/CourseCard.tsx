import Link from 'next/link'
import { getBrand, LEVEL_COLORS } from '@/lib/brands'
import styles from './CourseCard.module.css'

interface CourseCardProps {
  slug: string; title: string; description?: string;
  softwareSlug: string; level?: string; duration?: string;
  unitCount?: number; available?: boolean;
}

export default function CourseCard({ slug, title, description, softwareSlug, level, duration, unitCount, available = true }: CourseCardProps) {
  const brand = getBrand(softwareSlug)
  return (
    <Link href={available ? '/courses/' + slug : '#'} className={styles.card} style={{ '--sw-color': brand.color, '--sw-light': brand.light } as React.CSSProperties}>
      <div className={styles.topLine} />
      <span className={styles.tag} style={{ background: brand.light, color: brand.color }}>{brand.name}</span>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.desc}>{description}</p>}
      <div className={styles.meta}>
        {duration && <span className={styles.metaItem}>{duration}</span>}
        {unitCount && <span className={styles.metaItem}>{unitCount} unità</span>}
        {level && <span className={styles.metaItem} style={{ color: LEVEL_COLORS[level] || 'var(--muted)' }}>{level}</span>}
        {available ? (
          <span className={styles.cta}>inizia <span className={styles.arrow}>→</span></span>
        ) : (
          <span className={styles.locked}>prossimamente</span>
        )}
      </div>
    </Link>
  )
}
