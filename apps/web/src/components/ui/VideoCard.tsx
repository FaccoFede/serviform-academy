import Image from 'next/image'
import { getBrand, DbSoftware } from '@/lib/brands'
import styles from './VideoCard.module.css'

/**
 * VideoCard — card per la griglia delle video pillole.
 *
 * Mostra: thumbnail YouTube, tag software, titolo, data.
 * Al click apre il video in un modal (gestito dal parent).
 */
interface VideoCardProps {
  title: string
  youtubeId: string
  softwareSlug: string
  /** Software object dal DB — quando presente, name/color dal DB prevalgono sui default */
  software?: DbSoftware | null
  date?: string
  onClick?: () => void
}

export default function VideoCard({
  title,
  youtubeId,
  softwareSlug,
  software,
  date,
  onClick,
}: VideoCardProps) {
  const brand = getBrand(softwareSlug, software)

  return (
    <div className={styles.card} onClick={onClick}>
      {/* Thumbnail */}
      <div className={styles.thumb}>
        <Image
          src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          style={{ objectFit: 'cover' }}
          unoptimized
        />
        <span className={styles.playChip}>
          <svg width={8} height={8} viewBox="0 0 8 8" fill="none">
            <path d="M1.5 1.5l5 2.5-5 2.5V1.5z" fill="#fff" />
          </svg>
          Play
        </span>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <span className={styles.software}>{brand.name}</span>
        <h4 className={styles.title}>{title}</h4>
        {date && <span className={styles.date}>{date}</span>}
      </div>
    </div>
  )
}
