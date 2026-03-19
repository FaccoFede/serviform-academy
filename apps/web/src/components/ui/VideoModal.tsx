'use client'

import { useEffect, useCallback } from 'react'
import styles from './VideoModal.module.css'

/**
 * VideoModal — overlay modale per la riproduzione video YouTube.
 *
 * Si apre con animazione di fade + scale.
 * Chiude con: click sullo sfondo, bottone X, tasto Escape.
 * L'iframe viene caricato solo quando il modal è aperto.
 */
interface VideoModalProps {
  youtubeId: string | null
  title?: string
  onClose: () => void
}

export default function VideoModal({ youtubeId, title, onClose }: VideoModalProps) {
  const isOpen = youtubeId !== null

  // Chiudi con Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        {/* Video player */}
        <div className={styles.video}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
            allowFullScreen
            allow="autoplay; encrypted-media"
          />
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.title}>{title || ''}</span>
          <button className={styles.close} onClick={onClose}>
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
