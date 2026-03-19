import { api, VideoPill } from '@/lib/api'
import VideosView from './VideosView'

/**
 * Pagina Video Pillole — Server Component.
 *
 * Fa il fetch delle video pillole dal backend
 * e passa i dati al VideosView (Client Component)
 * per la gestione del player modale.
 */
export default async function VideosPage() {
  let videos: VideoPill[] = []

  try {
    videos = await api.videos.findAll()
  } catch {
    // Fallback: pagina vuota in caso di errore API
  }

  return <VideosView videos={videos} />
}
