'use client'

/**
 * ProtectedVideo — player video protetto.
 * FIX: l'overlay non blocca le interazioni col player (pointer-events: none).
 * Il blocco del tasto destro viene applicato solo al container, non all'iframe.
 */
interface ProtectedVideoProps {
  url: string
  title?: string
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(url)
}

export default function ProtectedVideo({ url, title }: ProtectedVideoProps) {
  if (!url) return null

  if (isDirectVideo(url)) {
    return (
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden', background: '#000', margin: '24px 0' }}
        onContextMenu={e => e.preventDefault()}>
        <video
          style={{ width: '100%', height: '100%', display: 'block' }}
          controls
          controlsList="nodownload"
          disablePictureInPicture
          playsInline
        >
          <source src={url}/>
          Il tuo browser non supporta la riproduzione video.
        </video>
      </div>
    )
  }

  // Iframe embed — Vimeo, Bunny.net, Loom, ecc.
  // NOTA: l'overlay ha pointer-events: none per non bloccare i controlli del player
  return (
    <div
      style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden', background: '#000', margin: '24px 0' }}
      onContextMenu={e => e.preventDefault()}
    >
      <iframe
        src={url}
        title={title || 'Video lezione'}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', zIndex: 1 }}
        referrerPolicy="strict-origin"
      />
      {/* Overlay trasparente: pointer-events none = non blocca il player */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'transparent', pointerEvents: 'none' }}/>
    </div>
  )
}
