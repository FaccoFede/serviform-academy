const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // Propaga il token JWT se presente in localStorage (client-side only)
  const token = typeof window !== 'undefined' ? localStorage.getItem('sa_token') : null
  const authHeader = token ? { Authorization: 'Bearer ' + token } : {}

  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Errore di rete' }))
    throw new Error(err.message || 'Errore ' + res.status)
  }
  return res.json()
}

// ─── Tipi base ────────────────────────────────────────────────────────────────

export interface Software {
  id: string
  name: string
  slug: string
  tagline?: string
  color?: string
  lightColor?: string
}

export interface Course {
  id: string
  title: string
  slug: string
  description?: string
  level?: string
  duration?: string
  available: boolean
  software?: Software
  units?: Unit[]
}

export interface Unit {
  id: string
  title: string
  slug: string
  order: number
  subtitle?: string
  duration?: string
  unitType: 'OVERVIEW' | 'LESSON' | 'EXERCISE'
  content?: string
  courseId: string
}

// ─── Client API ───────────────────────────────────────────────────────────────
// SCOPE CLEANUP:
// - rimosso api.pricing (fuori scope Academy)
// - rimosso api.videos (videopillole fuori scope attivo)
// - rimosso api.sync   (legato a video pill import)
// - rimosso api.events (fuori scope attivo, da rivalutare)
// Mantenuti: software, courses, units, guides, progress, certificates, auth, exercises

export const api = {
  software: {
    findAll: () => request<Software[]>('/software'),
    findBySlug: (slug: string) => request<Software>('/software/' + slug),
    create: (data: any) => request('/software', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request('/software/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  },

  courses: {
    findAll: () => request<Course[]>('/courses', { cache: 'no-store' }),
    findBySlug: (slug: string) => request<Course>('/courses/' + slug, { cache: 'no-store' }),
    create: (data: any) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request('/courses/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/courses/' + id, { method: 'DELETE' }),
  },

  units: {
    findBySlug: (cs: string, us: string) =>
      request<Unit>('/units/' + cs + '/' + us, { cache: 'no-store' }),
    findByCourse: (courseId: string) =>
      request<Unit[]>('/units/course/' + courseId),
    create: (data: any) => request('/units', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request('/units/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/units/' + id, { method: 'DELETE' }),
  },

  exercises: {
    findByUnit: (unitId: string) => request<any[]>('/exercises/unit/' + unitId),
    create: (data: any) => request('/exercises', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request('/exercises/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/exercises/' + id, { method: 'DELETE' }),
  },

  guides: {
    findByUnit: (unitId: string) => request<any>('/guides/unit/' + unitId),
    create: (data: any) => request('/guides', { method: 'POST', body: JSON.stringify(data) }),
  },

  progress: {
    complete: (unitId: string) =>
      // NOTA: userId rimosso dal body — il backend deve dedurlo dal JWT (regola critica doc 06)
      request('/progress/complete', { method: 'POST', body: JSON.stringify({ unitId }) }),
    getCourseProgress: (courseSlug: string) =>
      // NOTA: userId rimosso dal path — il backend lo deduce dal token
      request<any>('/progress/course/' + courseSlug),
  },

  certificates: {
    issue: (courseSlug: string) =>
      request('/certificates/issue', { method: 'POST', body: JSON.stringify({ courseSlug }) }),
  },

  auth: {
    login: (email: string, password: string) =>
      request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email: string, password: string, name?: string) =>
      request<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),
    profile: (token: string) =>
      request<any>('/auth/profile', { headers: { Authorization: 'Bearer ' + token } }),
  },
}
