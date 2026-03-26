'use client'

/**
 * ProtectedVideo — player video protetto contro il download.
 *
 * Supporta:
 *  - URL iframe embed diretti (Vimeo, Bunny.net/iframe.mediadelivery.net, Loom, ecc.)
 *  - URL video diretti (.mp4, .webm) tramite <video>
 *
 * Protezioni applicate:
 *  - controlsList="nodownload" sull'elemento video
 *  - onContextMenu preventDefault (blocca tasto destro sul video)
 *  - CSS overlay trasparente sopra l'iframe (blocca click destro e drag)
 *  - allow="encrypted-media" sull'iframe
 *
 * NOTA: queste protezioni sono sufficienti per la maggior parte degli utenti.
 * Per protezione totale in produzione usare un CDN con token firmati
 * (Bunny.net signed URLs, Cloudflare Stream, Mux).
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
      <div className="video-wrapper">
        <video
          className="video-el"
          controls
          controlsList="nodownload nofullscreen"
          disablePictureInPicture
          onContextMenu={e => e.preventDefault()}
          playsInline
        >
          <source src={url} />
          Il tuo browser non supporta la riproduzione video.
        </video>
        <style>{`
          .video-wrapper { position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 10px; overflow: hidden; background: #000; margin: 24px 0; }
          .video-el { width: 100%; height: 100%; display: block; }
        `}</style>
      </div>
    )
  }

  // Iframe embed (Vimeo, Bunny, Loom, ecc.)
  return (
    <div className="iframe-wrapper">
      <iframe
        src={url}
        title={title || 'Video lezione'}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="iframe-el"
        referrerPolicy="strict-origin"
      />
      {/* Overlay trasparente — blocca tasto destro e download drag-and-drop */}
      <div
        className="iframe-overlay"
        onContextMenu={e => e.preventDefault()}
        onDragStart={e => e.preventDefault()}
      />
      <style>{`
        .iframe-wrapper { position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 10px; overflow: hidden; background: #000; margin: 24px 0; }
        .iframe-el { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
        .iframe-overlay { position: absolute; inset: 0; z-index: 1; background: transparent; }
      `}</style>
    </div>
  )
}
