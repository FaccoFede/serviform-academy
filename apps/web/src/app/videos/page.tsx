import { api } from '@/lib/api'
import VideosView from './VideosView'

export default async function VideosPage() {
  let videos: any[] = []
  let software: any[] = []
  try {
    videos = await api.videos.findAll()
    software = await api.software.findAll()
  } catch {}
  return <VideosView videos={videos} software={software} />
}
