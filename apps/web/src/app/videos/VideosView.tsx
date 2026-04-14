'use client'
import { useState } from 'react'
import { getBrand } from '@/lib/brands'
import { VideoCard, VideoModal } from '@/components/ui'
import styles from './VideosView.module.css'

export default function VideosView({ videos, software }: { videos: any[]; software: any[] }) {
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [modal, setModal] = useState<{ youtubeId: string; title: string } | null>(null)

  const filtered = activeTab ? videos.filter(v => v.software?.slug === activeTab) : videos
  const featured = filtered[0]
  const archive = filtered.slice(1)

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <h1>Video Pillole</h1>
          <p>Tutorial brevi e pratici sui software Serviform, pubblicati mensilmente.</p>
        </div>
      </section>

      <div className={styles.tabs}>
        <button className={!activeTab ? styles.tabActive : styles.tab} onClick={() => setActiveTab(null)}>Tutti</button>
        {software.map(sw => {
          const brand = getBrand(sw.slug, sw)
          return (
            <button key={sw.slug} className={activeTab === sw.slug ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab(sw.slug)}
              style={{ '--tab-color': brand.color } as React.CSSProperties}>
              <span className={styles.tabDot} style={{ background: brand.color }} />
              {brand.name}
            </button>
          )
        })}
      </div>

      {featured && (
        <section className={styles.featured}>
          <div className={styles.featuredThumb} onClick={() => setModal({ youtubeId: featured.youtubeId, title: featured.title })}>
            <img src={"https://img.youtube.com/vi/" + featured.youtubeId + "/maxresdefault.jpg"} alt={featured.title} />
            <div className={styles.playOverlay}>
              <div className={styles.playBtn}>
                <svg width={20} height={20} viewBox="0 0 20 20" fill="none"><path d="M6 4l10 6-10 6V4z" fill="#fff"/></svg>
              </div>
            </div>
          </div>
          <div className={styles.featuredInfo}>
            <span className={styles.featuredLabel}>{getBrand(featured.software?.slug, featured.software).name} · Ultima pillola</span>
            <h2>{featured.title}</h2>
            {featured.description && <p>{featured.description}</p>}
          </div>
        </section>
      )}

      <section className={styles.archive}>
        <div className={styles.archiveHeader}>
          <h3>Archivio pillole</h3>
          <span className={styles.count}>{archive.length} video</span>
        </div>
        <div className={styles.grid}>
          {archive.map(v => (
            <VideoCard key={v.id} title={v.title} youtubeId={v.youtubeId}
              softwareSlug={v.software?.slug || ''}
              software={v.software}
              onClick={() => setModal({ youtubeId: v.youtubeId, title: v.title })} />
          ))}
        </div>
        {filtered.length === 0 && <p className={styles.empty}>Nessun video per questo software.</p>}
      </section>

      <VideoModal youtubeId={modal?.youtubeId || null} title={modal?.title} onClose={() => setModal(null)} />
    </>
  )
}
