/**
 * Client API centralizzato per Serviform Academy.
 *
 * Sostituisce tutte le chiamate fetch con URL hardcoded.
 * Usa NEXT_PUBLIC_API_URL dall'ambiente per puntare al backend.
 *
 * Utilizzo:
 *   import { api } from '@/lib/api'
 *   const courses = await api.courses.findAll()
 *   const course = await api.courses.findBySlug('modulo-3d')
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Fetch wrapper con gestione errori strutturata.
 * Lancia un errore con il messaggio del backend se la risposta non è OK.
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Errore di rete' }))
    throw new ApiError(
      error.message || `Errore ${res.status}`,
      res.status,
      error,
    )
  }

  return res.json()
}

/**
 * Errore API tipizzato con status code e dettagli dal backend.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Types ──────────────────────────────────────

export interface Software {
  id: string
  name: string
  slug: string
  createdAt: string
}

export interface Course {
  id: string
  title: string
  slug: string
  description?: string
  softwareId: string
  createdAt: string
  software: Software
  units?: Unit[]
}

export interface Unit {
  id: string
  title: string
  slug: string
  order: number
  courseId: string
  createdAt: string
  guide?: GuideReference
  course?: Course & { units: Unit[] }
}

export interface GuideReference {
  id: string
  zendeskId: string
  title: string
  url: string
  unitId: string
}

export interface VideoPill {
  id: string
  title: string
  description?: string
  youtubeId: string
  softwareId: string
  createdAt: string
  software: Software
}

export interface CourseProgress {
  total: number
  completed: number
  percent: number
}

export interface Certificate {
  id: string
  userId: string
  courseId: string
  issuedAt: string
}

// ─── API Client ─────────────────────────────────

export const api = {
  /** Operazioni sui software */
  software: {
    findAll: () =>
      request<Software[]>('/software'),

    create: (data: { name: string; slug: string }) =>
      request<Software>('/software', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  /** Operazioni sui corsi */
  courses: {
    findAll: () =>
      request<Course[]>('/courses', { cache: 'no-store' }),

    findBySlug: (slug: string) =>
      request<Course>(`/courses/${slug}`, { cache: 'no-store' }),

    create: (data: {
      title: string
      slug: string
      description?: string
      softwareId: string
    }) =>
      request<Course>('/courses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  /** Operazioni sulle unità */
  units: {
    findBySlug: (courseSlug: string, unitSlug: string) =>
      request<Unit>(`/units/${courseSlug}/${unitSlug}`, { cache: 'no-store' }),

    create: (data: { title: string; order: number; courseId: string }) =>
      request<Unit>('/units', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  /** Operazioni sulle video pillole */
  videos: {
    findAll: () =>
      request<VideoPill[]>('/videos', { cache: 'no-store' }),

    findBySoftware: (softwareSlug: string) =>
      request<VideoPill[]>(`/videos/software/${softwareSlug}`, {
        cache: 'no-store',
      }),

    create: (data: {
      title: string
      youtubeId: string
      softwareId: string
      description?: string
    }) =>
      request<VideoPill>('/videos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  /** Operazioni sulle guide */
  guides: {
    findByUnit: (unitId: string) =>
      request<GuideReference>(`/guides/unit/${unitId}`),

    create: (data: {
      zendeskId: string
      title: string
      url: string
      unitId: string
    }) =>
      request<GuideReference>('/guides', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  /** Operazioni sul progresso */
  progress: {
    complete: (userId: string, unitId: string) =>
      request('/progress/complete', {
        method: 'POST',
        body: JSON.stringify({ userId, unitId }),
      }),

    getCourseProgress: (userId: string, courseSlug: string) =>
      request<CourseProgress>(`/progress/${userId}/course/${courseSlug}`),
  },

  /** Operazioni sui certificati */
  certificates: {
    issue: (userId: string, courseSlug: string) =>
      request<Certificate>('/certificates/issue', {
        method: 'POST',
        body: JSON.stringify({ userId, courseSlug }),
      }),
  },

  /** Operazioni di sincronizzazione */
  sync: {
    importVideoPill: (data: {
      title: string
      youtubeId: string
      description?: string
      softwareSlug: string
    }) =>
      request('/sync/video-pill', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
}
