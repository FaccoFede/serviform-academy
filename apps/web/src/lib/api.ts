/**
 * lib/api.ts — client HTTP con token auto-iniettato.
 *
 * Se il server risponde 401 (token scaduto / utente non trovato):
 *   → cancella il token da localStorage
 *   → reindirizza a /auth/login
 * Questo rompe il loop "401 silenzioso" nelle pagine admin.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('sa_token')
}

function handleUnauthorized() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('sa_token')
  // Redirect solo se non siamo già sulla pagina di login
  if (!window.location.pathname.startsWith('/auth')) {
    window.location.href = '/auth/login'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  }
  if (token && !headers['Authorization']) {
    headers['Authorization'] = 'Bearer ' + token
  }

  const res = await fetch(BASE_URL + path, { ...options, headers })

  // 401 = token invalido/scaduto → logout automatico
  if (res.status === 401) {
    handleUnauthorized()
    throw new Error('Sessione scaduta. Effettua di nuovo il login.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Errore di rete' }))
    throw new Error(err.message || `Errore ${res.status}`)
  }

  return res.json()
}

export interface Software { id: string; name: string; slug: string; tagline?: string; color?: string; lightColor?: string }
export interface Course { id: string; title: string; slug: string; description?: string; level?: string; duration?: string; available: boolean; publishState?: string; software?: Software; units?: Unit[] }
export interface Unit { id: string; title: string; slug: string; order: number; subtitle?: string; duration?: string; unitType: string; content?: string; videoUrl?: string; courseId: string; guide?: any; exercises?: any[] }

export const api = {
  software: {
    findAll: () => request<Software[]>('/software'),
    findBySlug: (slug: string) => request<Software>('/software/' + slug),
    create: (data: any) => request('/software', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/software/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  },
  courses: {
    findAll: () => request<Course[]>('/courses', { cache: 'no-store' }),
    findBySlug: (slug: string) => request<Course>('/courses/' + slug, { cache: 'no-store' }),
    create: (data: any) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/courses/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/courses/' + id, { method: 'DELETE' }),
  },
  units: {
    findBySlug: (cs: string, us: string) => request<Unit>(`/units/${cs}/${us}`, { cache: 'no-store' }),
    findByCourse: (courseId: string) => request<Unit[]>('/units/course/' + courseId),
    create: (data: any) => request('/units', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/units/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/units/' + id, { method: 'DELETE' }),
  },
  exercises: {
    findByUnit: (unitId: string) => request<any[]>('/exercises/unit/' + unitId),
    create: (data: any) => request('/exercises', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/exercises/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/exercises/' + id, { method: 'DELETE' }),
  },
  guides: {
    findByUnit: (unitId: string) => request<any>('/guides/unit/' + unitId),
    create: (data: any) => request('/guides', { method: 'POST', body: JSON.stringify(data) }),
  },
  companies: {
    findAll: () => request<any[]>('/companies'),
    findById: (id: string) => request<any>('/companies/' + id),
    create: (data: any) => request('/companies', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/companies/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/companies/' + id, { method: 'DELETE' }),
  },
  users: {
    findAll: () => request<any[]>('/users'),
    findById: (id: string) => request<any>('/users/' + id),
    create: (data: any) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/users/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/users/' + id, { method: 'DELETE' }),
  },
  assignments: {
    findByCompany: (id: string) => request<any[]>('/assignments/company/' + id),
    assignToCompany: (cid: string, rid: string, data: any) => request(`/assignments/company/${cid}/course/${rid}`, { method: 'POST', body: JSON.stringify(data) }),
    updateCompany: (id: string, data: any) => request('/assignments/company/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    removeCompany: (id: string) => request('/assignments/company/' + id, { method: 'DELETE' }),
    findByUser: (id: string) => request<any[]>('/assignments/user/' + id),
    assignToUser: (uid: string, cid: string, data: any) => request(`/assignments/user/${uid}/course/${cid}`, { method: 'POST', body: JSON.stringify(data) }),
    removeUser: (id: string) => request('/assignments/user/' + id, { method: 'DELETE' }),
  },
  announcements: {
    findPublished: () => request<any[]>('/announcements'),
    findAll: () => request<any[]>('/announcements/admin/all'),
    create: (data: any) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/announcements/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/announcements/' + id, { method: 'DELETE' }),
  },
  progress: {
    complete: (unitId: string) => request('/progress/complete', { method: 'POST', body: JSON.stringify({ unitId }) }),
    viewed: (unitId: string) => request('/progress/viewed', { method: 'POST', body: JSON.stringify({ unitId }) }),
    getCourseProgress: (slug: string) => request<any>('/progress/course/' + slug),
    getCompletedUnits: (slug: string) => request<string[]>(`/progress/course/${slug}/completed-units`),
    getLastViewed: () => request<any>('/progress/last-viewed'),
    getAll: () => request<any[]>('/progress/all'),
  },
  certificates: {
    issue: (slug: string) => request('/certificates/issue', { method: 'POST', body: JSON.stringify({ courseSlug: slug }) }),
  },
  auth: {
    login: (email: string, password: string) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email: string, password: string, name?: string) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
    profile: () => request<any>('/auth/profile'),
    promoteAdmin: () => request<any>('/auth/promote-admin', { method: 'POST' }),
  },
}
