'use client'

/**
 * ProtectedVideo — player video che supporta:
 *
 * 1. YouTube URL (qualsiasi formato) → convertito in embed:
 *    - https://www.youtube.com/watch?v=VIDEOID
 *    - https://youtu.be/VIDEOID
 *    - https://www.youtube.com/embed/VIDEOID (già embed)
 *    - https://youtube.com/shorts/VIDEOID
 *
 * 2. Vimeo embed (player.vimeo.com)
 * 3. Bunny.net (iframe.mediadelivery.net)
 * 4. Loom (loom.com/embed)
 * 5. URL video diretti (.mp4, .webm, .ogg)
 *
 * 6. SharePoint / OneDrive — NON embeddabile per policy Microsoft.
 *    Viene mostrato un fallback chiaro con link "Apri in nuova scheda".
 *
 * Protezioni iframe:
 * - overlay trasparente (blocca tasto destro + drag)
 * - allow="encrypted-media"
 * - referrerPolicy="strict-origin"
 */

import { resolveVideoUrl } from '@/lib/api'

interface ProtectedVideoProps {
  url: string
  title?: string
}

type VideoType = 'youtube' | 'vimeo' | 'bunny' | 'direct' | 'iframe' | 'sharepoint' | 'unknown'

interface ParsedVideo {
  type: VideoType
  embedUrl: string | null
  originalUrl: string
}

// ─── Parsers ────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  // Formati supportati:
  // - youtube.com/watch?v=ID
  // - youtu.be/ID
  // - youtube.com/embed/ID
  // - youtube.com/shorts/ID
  // - youtube.com/v/ID
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function parseVideoUrl(url: string): ParsedVideo {
  if (!url) return { type: 'unknown', embedUrl: null, originalUrl: url }

  // Risolvi eventuali path relativi (/uploads/videos/...) in URL assoluto
  // usando il NEXT_PUBLIC_API_URL del client. Questo è il motivo per cui
  // i video del catalogo non partivano quando l'URL era hardcoded a localhost.
  const clean = resolveVideoUrl(url.trim())

  // SharePoint / OneDrive — non embeddabili in iframe per policy Microsoft
  if (
    clean.includes('sharepoint.com') ||
    clean.includes('1drv.ms') ||
    clean.includes('onedrive.live.com') ||
    clean.includes('sharepoint.') // es. tenant.sharepoint.com
  ) {
    return { type: 'sharepoint', embedUrl: null, originalUrl: clean }
  }

  // YouTube — vari formati
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) {
    const id = extractYouTubeId(clean)
    if (id) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
        originalUrl: clean,
      }
    }
    // URL YouTube non riconosciuto
    return { type: 'unknown', embedUrl: null, originalUrl: clean }
  }

  // Vimeo player
  if (clean.includes('vimeo.com')) {
    // player.vimeo.com/video/ID — già embed
    if (clean.includes('player.vimeo.com')) {
      return { type: 'vimeo', embedUrl: clean, originalUrl: clean }
    }
    // vimeo.com/VIDEO_ID → converti
    const m = clean.match(/vimeo\.com\/(\d+)/)
    if (m) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${m[1]}`,
        originalUrl: clean,
      }
    }
  }

  // Bunny.net / MediaDelivery
  if (clean.includes('iframe.mediadelivery.net') || clean.includes('bunny.net')) {
    return { type: 'bunny', embedUrl: clean, originalUrl: clean }
  }

  // Loom
  if (clean.includes('loom.com/share') || clean.includes('loom.com/embed')) {
    const embedUrl = clean.replace('/share/', '/embed/')
    return { type: 'iframe', embedUrl, originalUrl: clean }
  }

  // Video diretto
  if (/\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(clean)) {
    return { type: 'direct', embedUrl: clean, originalUrl: clean }
  }

  // Generico iframe (Loom, Wistia, altri embed diretti)
  if (clean.startsWith('https://') || clean.startsWith('http://')) {
    return { type: 'iframe', embedUrl: clean, originalUrl: clean }
  }

  return { type: 'unknown', embedUrl: null, originalUrl: clean }
}

// ─── Componente ─────────────────────────────────────────────────────────────

export default function ProtectedVideo({ url, title }: ProtectedVideoProps) {
  if (!url) return null

  const parsed = parseVideoUrl(url)

  // ── SharePoint / OneDrive ─────────────────────────────────────────────────
  if (parsed.type === 'sharepoint') {
    return (
      <div style={styles.fallbackBox}>
        <div style={styles.fallbackIcon}>
          <svg viewBox="0 0 24 24" fill="none" width={32} height={32}>
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="#067DB8" strokeWidth="1.5"/>
            <path d="M8 12h8M12 8v8" stroke="#067DB8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={styles.fallbackContent}>
          <div style={styles.fallbackTitle}>Contenuto SharePoint</div>
          <div style={styles.fallbackDesc}>
            I file SharePoint non possono essere incorporati direttamente per limitazioni di sicurezza Microsoft.
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.fallbackBtn}
          >
            Apri in SharePoint →
          </a>
        </div>
      </div>
    )
  }

  // ── URL non riconosciuto ──────────────────────────────────────────────────
  if (parsed.type === 'unknown' || !parsed.embedUrl) {
    return (
      <div style={styles.fallbackBox}>
        <div style={styles.fallbackContent}>
          <div style={styles.fallbackTitle}>Video non disponibile</div>
          <div style={styles.fallbackDesc}>
            Il formato del link video non è supportato. Contatta l'amministratore.
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" style={styles.fallbackBtn}>
            Prova ad aprire il link →
          </a>
        </div>
      </div>
    )
  }

  // ── Video diretto .mp4 / .webm ────────────────────────────────────────────
  if (parsed.type === 'direct') {
    return (
      <div style={styles.wrapper}>
        <video
          style={styles.videoEl}
          controls
          controlsList="nodownload nofullscreen"
          disablePictureInPicture
          onContextMenu={e => e.preventDefault()}
          playsInline
        >
          <source src={parsed.embedUrl!} />
          Il tuo browser non supporta la riproduzione video.
        </video>
      </div>
    )
  }

  // ── Iframe (YouTube, Vimeo, Bunny, Loom, generico) ────────────────────────
  return (
    <div style={styles.wrapper}>
      <iframe
        src={parsed.embedUrl!}
        title={title || 'Video lezione'}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        style={styles.iframeEl}
        referrerPolicy="strict-origin"
        loading="lazy"
      />
      {/* Overlay: blocca tasto destro e drag */}
      <div
        style={styles.overlay}
        onContextMenu={e => e.preventDefault()}
        onDragStart={e => e.preventDefault()}
      />
    </div>
  )
}

// ─── Stili inline ────────────────────────────────────────────────────────────
// Usiamo inline per evitare dipendenze da CSS module quando il componente
// è usato in contesti diversi. I valori rispettano il design system.

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16/9',
    borderRadius: 10,
    overflow: 'hidden',
    background: '#000',
    margin: '24px 0',
  },
  iframeEl: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  },
  videoEl: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    background: 'transparent',
    pointerEvents: 'none', // permette click sui controlli ma non drag
  },
  fallbackBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    padding: '20px 24px',
    background: '#F0F9FF',
    border: '1px solid #BAE6FD',
    borderRadius: 10,
    margin: '24px 0',
  },
  fallbackIcon: {
    flexShrink: 0,
    paddingTop: 2,
  },
  fallbackContent: {
    flex: 1,
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0C4A6E',
    marginBottom: 6,
  },
  fallbackDesc: {
    fontSize: 13,
    color: '#075985',
    lineHeight: 1.6,
    marginBottom: 12,
  },
  fallbackBtn: {
    display: 'inline-block',
    padding: '8px 16px',
    background: '#0369A1',
    color: '#fff',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
  },
}
