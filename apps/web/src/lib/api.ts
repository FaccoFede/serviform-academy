/**
 * lib/api.ts — client HTTP con token auto-iniettato.
 *
 * Se il server risponde 401 (token scaduto / utente non trovato):
 *   → cancella il token da localStorage
 *   → reindirizza a /auth/login
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const BASE_URL = API_BASE_URL

/**
 * Risolve un URL video che può essere:
 *  - assoluto (http/https) → ritornato così com'è
 *  - relativo (es. "/uploads/videos/...") → prefissato con API_BASE_URL
 *
 * Da quando i VideoAsset caricati vengono salvati con path relativo
 * (per evitare URL hardcoded a localhost), il client deve risolverli
 * dinamicamente usando il base URL dell'API configurato per l'ambiente.
 */
export function resolveVideoUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return API_BASE_URL.replace(/\/$/, '') + url
  return url
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('sa_token')
}

function handleUnauthorized() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('sa_token')
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

  if (res.status === 401) {
    handleUnauthorized()
    throw new Error('Sessione scaduta. Effettua di nuovo il login.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Errore di rete' }))
    // Gestisce sia message stringa che message array (class-validator)
    const msg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || `Errore ${res.status}`)
    throw new Error(msg)
  }

  return res.json()
}

export interface Software { id: string; name: string; slug: string; tagline?: string; color?: string; lightColor?: string }
export interface Course { id: string; title: string; slug: string; description?: string; level?: string; duration?: string; available: boolean; publishState?: string; thumbnailUrl?: string; software?: Software; units?: Unit[] }
export interface Unit { id: string; title: string; slug: string; order: number; subtitle?: string; duration?: string; unitType: string; content?: string; videoUrl?: string; courseId: string; guide?: any; exercises?: any[] }

export const api = {
  software: {
    findAll: () => request<Software[]>('/software'),
    findBySlug: (slug: string) => request<Software>('/software/' + slug),
    create: (data: any) => request('/software', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/software/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  },
  courses: {
    findAll: () => request<Course[]>('/courses'),
    // Corsi filtrati in base alle preferenze dell'azienda dell'utente loggato.
    // Da usare nelle pagine del portale (catalog, dashboard) per rispettare
    // la visibilità configurata dall'admin sull'azienda.
    findForPortal: () => request<Course[]>('/courses/portal'),
    findBySlug: (slug: string) => request<Course>('/courses/' + slug),
    create: (data: any) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/courses/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/courses/' + id, { method: 'DELETE' }),
  },
  units: {
    findByCourse: (courseId: string) => request<Unit[]>('/units/course/' + courseId),
    findBySlug: (courseSlug: string, unitSlug: string) => request<Unit>(`/units/${courseSlug}/${unitSlug}`),
    create: (data: any) => request('/units', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/units/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/units/' + id, { method: 'DELETE' }),
    // Riordina le unità di un corso. Il backend assegna order 1,2,3…
    // L'unità OVERVIEW resta sempre a 0.
    reorder: (courseId: string, unitIds: string[]) =>
      request(`/units/course/${courseId}/reorder`, { method: 'POST', body: JSON.stringify({ unitIds }) }),
  },
  videos: {
    findAll: () => request<any[]>('/videos'),
    findBySoftware: (slug: string) => request<any[]>('/videos/software/' + slug),
    create: (data: any) => request('/videos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/videos/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/videos/' + id, { method: 'DELETE' }),
  },
  exercises: {
    findAll: () => request<any[]>('/exercises'),
    findByUnit: (unitId: string) => request<any[]>('/exercises/unit/' + unitId),
    create: (data: any) => request('/exercises', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/exercises/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/exercises/' + id, { method: 'DELETE' }),
  },
  events: {
    // Pubblica: solo eventi pubblicati
    findAll: () => request<any[]>('/events'),
    findUpcoming: () => request<any[]>('/events/upcoming'),
    findPast: () => request<any[]>('/events/past'),
    findOne: (id: string) => request<any>('/events/' + id),
    // Admin: tutti gli eventi (inclusi non pubblicati)
    findAllAdmin: () => request<any[]>('/events/admin/all'),
    create: (data: any) => request('/events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/events/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/events/' + id, { method: 'DELETE' }),
  },
  pricing: {
    findAll: () => request<any[]>('/pricing'),
    create: (data: any) => request('/pricing', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/pricing/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/pricing/' + id, { method: 'DELETE' }),
  },
  guides: {
    findByUnit: (unitId: string) => request<any[]>('/guides/unit/' + unitId),
    create: (data: any) => request('/guides', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: string) => request('/guides/' + id, { method: 'DELETE' }),
    removeAllByUnit: (unitId: string) => request(`/guides/unit/${unitId}/all`, { method: 'DELETE' }),
  },
  // Catalogo guide Zendesk: l'admin registra un link, il titolo è recuperato
  // automaticamente dal backend; nelle unità si selezionano guide già presenti.
  guideCatalog: {
    findAll: () => request<any[]>('/guide-catalog'),
    create: (data: { url: string; title?: string; zendeskId?: string }) =>
      request('/guide-catalog', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request('/guide-catalog/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    refreshTitle: (id: string) =>
      request(`/guide-catalog/${id}/refresh-title`, { method: 'POST' }),
    remove: (id: string) => request('/guide-catalog/' + id, { method: 'DELETE' }),
  },
  companies: {
    findAll: () => request<any[]>('/companies'),
    findById: (id: string) => request<any>('/companies/' + id),
    create: (data: any) => request('/companies', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/companies/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/companies/' + id, { method: 'DELETE' }),
    // Imposta i Software visibili nel portale per l'azienda.
    // Array vuoto = nessun filtro → l'azienda vede tutti i contenuti.
    setPreferences: (id: string, visibleSoftwareIds: string[]) =>
      request(`/companies/${id}/preferences`, { method: 'PUT', body: JSON.stringify({ visibleSoftwareIds }) }),
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
    my: () => request<any[]>('/certificates/my'),
    findAllAdmin: () => request<any[]>('/certificates/admin/all'),
    revoke: (id: string) => request('/certificates/' + id, { method: 'DELETE' }),
  },
  videoAssets: {
    findAll: () => request<any[]>('/video-assets'),
    findPublic: () => request<any[]>('/video-assets/public'),
    createExternal: (title: string, url: string) =>
      request('/video-assets/external', { method: 'POST', body: JSON.stringify({ title, url }) }),
    update: (id: string, data: any) =>
      request('/video-assets/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/video-assets/' + id, { method: 'DELETE' }),
  },
  uploads: {
  image: async (file: File, token: string) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(
      (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/uploads/image',
      { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd }
    )
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      throw new Error(e.message || 'Upload fallito')
    }
    return res.json() as Promise<{ url: string; filename: string }>
  },
},
  auth: {
    login: (email: string, password: string) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email: string, password: string, name?: string) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
    profile: () => request<any>('/auth/profile'),
    promoteAdmin: () => request<any>('/auth/promote-admin', { method: 'POST' }),
    // ── NUOVI endpoint profilo ──────────────────────────────────────────────
    updateProfile: (data: { name?: string; firstName?: string; lastName?: string; email?: string }) =>
      request<any>('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<any>('/auth/change-password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) }),
  },
}
