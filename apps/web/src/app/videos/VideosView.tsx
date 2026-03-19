'use client'

import { useState } from 'react'
import { VideoPill } from '@/lib/api'
import { getBrand } from '@/lib/brands'
import { VideoCard, VideoModal } from '@/components/ui'
import styles from './VideosView.module.css'

/**
 * VideosView — vista completa delle video pillole.
 *
 * Client Component per gestire:
 * - Video featured (il più recente)
 * - Griglia archivio
 * - Modal player YouTube
 */
interface VideosViewProps {
  videos: VideoPill[]
}

export default function VideosView({ videos }: VideosViewProps) {
  const [modalVideo, setModalVideo] = useState<{
    youtubeId: string
    title: string
  } | null>(null)

  // Il video featured è il primo (più recente per createdAt desc)
  const featured = videos[0]
  const archive = videos.slice(1)
  const featuredBrand = featured ? getBrand(featured.software?.slug || '') : null

  return (
    <>
      {/* Hero con video featured */}
      {featured && featuredBrand && (
        <section className={styles.hero}>
          <div className={styles.heroBg} />

          <div className={styles.featuredWrap}>
            <div
              className={styles.thumbBig}
              onClick={() =>
                setModalVideo({
                  youtubeId: featured.youtubeId,
                  title: featured.title,
                })
              }
            >
              <div className={styles.playOverlay}>
                <div className={styles.playBtn}>
                  <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                    <path d="M5 3.5l10 5.5-10 5.5V3.5z" fill="#fff" />
                  </svg>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.youtube.com/vi/${featured.youtubeId}/maxresdefault.jpg`}
                alt={featured.title}
                className={styles.thumbImg}
              />
            </div>
          </div>

          <div className={styles.heroInfo}>
            <div className={styles.heroLabel}>
              {featuredBrand.name} · Ultima Pillola
            </div>
            <h2 className={styles.heroTitle}>{featured.title}</h2>
            {featured.description && (
              <p className={styles.heroDesc}>{featured.description}</p>
            )}
          </div>
        </section>
      )}

      {/* Archivio */}
      <section className={styles.archive}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Archivio pillole</h3>
          <span className={styles.sectionCount}>{archive.length} video</span>
        </div>

        <div className={styles.videoGrid}>
          {archive.map((video) => (
            <VideoCard
              key={video.id}
              title={video.title}
              youtubeId={video.youtubeId}
              softwareSlug={video.software?.slug || ''}
              onClick={() =>
                setModalVideo({
                  youtubeId: video.youtubeId,
                  title: video.title,
                })
              }
            />
          ))}
        </div>

        {archive.length === 0 && videos.length <= 1 && (
          <p className={styles.empty}>
            Nessuna video pillola nell&apos;archivio.
          </p>
        )}
      </section>

      {/* Modal */}
      <VideoModal
        youtubeId={modalVideo?.youtubeId || null}
        title={modalVideo?.title}
        onClose={() => setModalVideo(null)}
      />
    </>
  )
}
