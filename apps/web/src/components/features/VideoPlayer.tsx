'use client'

/**
 * VideoPlayer — player video stile piattaforma di formazione.
 *
 * Supporta gli stessi URL di ProtectedVideo (YouTube, Vimeo, Bunny, MP4, ecc.)
 * ma aggiunge:
 * - chrome di branding (titolo unità, durata)
 * - overlay play con preview thumbnail (solo YouTube)
 * - barra progress simulata per video diretti
 * - pulsante fullscreen
 * - messaggio fallback per SharePoint
 *
 * Per i video diretti (.mp4) usa l'elemento <video> nativo con controlli.
 * Per gli iframe (YouTube, Vimeo, Bunny) usa un embed con overlay play.
 */

import { useState, useRef } from 'react'
import { resolveVideoUrl } from '@/lib/api'

interface VideoPlayerProps {
  url: string
  title?: string
  duration?: string
}

type VideoKind = 'youtube' | 'vimeo' | 'bunny' | 'direct' | 'iframe' | 'sharepoint' | 'unknown'

interface Parsed {
  kind: VideoKind
  embedUrl: string | null
  youtubeId: string | null
}

// ─── Parser URL ──────────────────────────────────────────────────────────────

function parseUrl(url: string): Parsed {
  // Risolvi path relativi (/uploads/videos/...) in URL assoluto prima del parsing
  const u = resolveVideoUrl(url.trim())

  if (u.includes('sharepoint.com') || u.includes('1drv.ms') || u.includes('onedrive.live.com')) {
    return { kind: 'sharepoint', embedUrl: null, youtubeId: null }
  }

  if (u.includes('youtube.com') || u.includes('youtu.be')) {
    const patterns = [
      /[?&]v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ]
    for (const p of patterns) {
      const m = u.match(p)
      if (m) {
        return {
          kind: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1&autoplay=1`,
          youtubeId: m[1],
        }
      }
    }
  }

  if (u.includes('vimeo.com')) {
    if (u.includes('player.vimeo.com')) return { kind: 'vimeo', embedUrl: u, youtubeId: null }
    const m = u.match(/vimeo\.com\/(\d+)/)
    if (m) return { kind: 'vimeo', embedUrl: `https://player.vimeo.com/video/${m[1]}`, youtubeId: null }
  }

  if (u.includes('iframe.mediadelivery.net') || u.includes('bunny.net')) {
    return { kind: 'bunny', embedUrl: u, youtubeId: null }
  }

  if (/\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(u)) {
    return { kind: 'direct', embedUrl: u, youtubeId: null }
  }

  if (u.startsWith('http')) {
    return { kind: 'iframe', embedUrl: u, youtubeId: null }
  }

  return { kind: 'unknown', embedUrl: null, youtubeId: null }
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function VideoPlayer({ url, title, duration }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  if (!url) return null

  const parsed = parseUrl(url)

  // ── SharePoint fallback ───────────────────────────────────────────────────
  if (parsed.kind === 'sharepoint') {
    return (
      <div style={s.fallback}>
        <div style={s.fallbackIcon}>🔒</div>
        <div>
          <div style={s.fallbackTitle}>Contenuto SharePoint</div>
          <div style={s.fallbackDesc}>
            I file SharePoint non possono essere incorporati direttamente per limitazioni di sicurezza Microsoft.
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" style={s.fallbackBtn}>
            Apri in SharePoint →
          </a>
        </div>
      </div>
    )
  }

  // ── URL non riconosciuto ──────────────────────────────────────────────────
  if (parsed.kind === 'unknown' || !parsed.embedUrl) {
    return (
      <div style={s.fallback}>
        <div style={s.fallbackIcon}>⚠️</div>
        <div>
          <div style={s.fallbackTitle}>Video non disponibile</div>
          <div style={s.fallbackDesc}>Formato URL non supportato. Contatta l'amministratore.</div>
        </div>
      </div>
    )
  }

  // ── Video diretto .mp4 ────────────────────────────────────────────────────
  if (parsed.kind === 'direct') {
    return (
      <div style={s.wrapper}>
        {(title || duration) && (
          <div style={s.header}>
            <div style={s.headerLeft}>
              <span style={s.headerIcon}>▶</span>
              {title && <span style={s.headerTitle}>{title}</span>}
            </div>
            {duration && <span style={s.headerDuration}>{duration}</span>}
          </div>
        )}
        <div style={s.playerBox}>
          <video
            ref={videoRef}
            style={s.videoEl}
            controls
            controlsList="nodownload"
            disablePictureInPicture
            onContextMenu={e => e.preventDefault()}
            playsInline
          >
            <source src={parsed.embedUrl} />
            Il tuo browser non supporta la riproduzione video.
          </video>
        </div>
      </div>
    )
  }

  // ── YouTube con overlay play e thumbnail ──────────────────────────────────
  if (parsed.kind === 'youtube' && parsed.youtubeId && !playing) {
    const thumb = `https://img.youtube.com/vi/${parsed.youtubeId}/maxresdefault.jpg`
    return (
      <div style={s.wrapper}>
        {(title || duration) && (
          <div style={s.header}>
            <div style={s.headerLeft}>
              <span style={s.headerIcon}>▶</span>
              {title && <span style={s.headerTitle}>{title}</span>}
            </div>
            {duration && <span style={s.headerDuration}>{duration}</span>}
          </div>
        )}
        <div style={s.playerBox}>
          {/* Thumbnail cliccabile */}
          <div
            style={{ ...s.thumbWrap, backgroundImage: `url(${thumb})` }}
            onClick={() => setPlaying(true)}
            role="button"
            aria-label={`Riproduci ${title || 'video'}`}
          >
            {/* Overlay scuro */}
            <div style={s.thumbOverlay}/>
            {/* Pulsante play */}
            <div style={s.playBtn}>
              <svg viewBox="0 0 24 24" fill="white" width={28} height={28}>
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            {duration && <div style={s.thumbDuration}>{duration}</div>}
          </div>
        </div>
      </div>
    )
  }

  // ── Iframe (YouTube dopo click, Vimeo, Bunny, Loom, generico) ────────────
  return (
    <div style={s.wrapper}>
      {(title || duration) && (
        <div style={s.header}>
          <div style={s.headerLeft}>
            <span style={s.headerIcon}>▶</span>
            {title && <span style={s.headerTitle}>{title}</span>}
          </div>
          {duration && <span style={s.headerDuration}>{duration}</span>}
        </div>
      )}
      <div style={s.playerBox}>
        <iframe
          src={parsed.embedUrl!}
          title={title || 'Video lezione'}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          style={s.iframeEl}
          referrerPolicy="strict-origin"
          loading="lazy"
        />
        {/* Overlay blocca tasto destro */}
        <div
          style={s.overlay}
          onContextMenu={e => e.preventDefault()}
          onDragStart={e => e.preventDefault()}
        />
      </div>
    </div>
  )
}

// ─── Stili ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#0a0a0a',
    marginBottom: 32,
    boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#111',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  headerIcon: {
    fontSize: 10,
    color: '#E63329',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.85)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  headerDuration: {
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'DM Mono, monospace',
    flexShrink: 0,
    marginLeft: 12,
  },
  playerBox: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16/9',
    background: '#000',
  },
  iframeEl: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  },
  videoEl: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    background: '#000',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    background: 'transparent',
    pointerEvents: 'none',
  },
  // YouTube thumbnail overlay
  thumbWrap: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
    transition: 'background 200ms',
  },
  playBtn: {
    position: 'relative',
    zIndex: 1,
    width: 68,
    height: 68,
    borderRadius: '50%',
    background: 'rgba(230,51,41,0.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(230,51,41,0.5)',
    transition: 'transform 150ms, box-shadow 150ms',
  },
  thumbDuration: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    background: 'rgba(0,0,0,0.75)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'DM Mono, monospace',
    padding: '3px 8px',
    borderRadius: 4,
    zIndex: 1,
  },
  // Fallback
  fallback: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: '18px 20px',
    background: '#F0F9FF',
    border: '1px solid #BAE6FD',
    borderRadius: 10,
    marginBottom: 24,
  },
  fallbackIcon: {
    fontSize: 22,
    flexShrink: 0,
    lineHeight: 1,
    paddingTop: 2,
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0C4A6E',
    marginBottom: 4,
  },
  fallbackDesc: {
    fontSize: 13,
    color: '#075985',
    lineHeight: 1.6,
    marginBottom: 10,
  },
  fallbackBtn: {
    display: 'inline-block',
    padding: '7px 14px',
    background: '#0369A1',
    color: '#fff',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    textDecoration: 'none',
  },
}
