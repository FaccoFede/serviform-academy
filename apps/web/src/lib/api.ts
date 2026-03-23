const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE_URL + path, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Errore di rete' }))
    throw new Error(err.message || 'Errore ' + res.status)
  }
  return res.json()
}

export const api = {
  software: {
    findAll: () => request<any[]>('/software'),
    findBySlug: (slug: string) => request<any>('/software/' + slug),
    create: (data: any) => request('/software', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/software/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  },
  courses: {
    findAll: () => request<any[]>('/courses', { cache: 'no-store' }),
    findBySlug: (slug: string) => request<any>('/courses/' + slug, { cache: 'no-store' }),
    create: (data: any) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/courses/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/courses/' + id, { method: 'DELETE' }),
  },
  units: {
    findBySlug: (cs: string, us: string) => request<any>('/units/' + cs + '/' + us, { cache: 'no-store' }),
    findByCourse: (courseId: string) => request<any[]>('/units/course/' + courseId),
    create: (data: any) => request('/units', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/units/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/units/' + id, { method: 'DELETE' }),
  },
  videos: {
    findAll: () => request<any[]>('/videos', { cache: 'no-store' }),
    findBySoftware: (slug: string) => request<any[]>('/videos/software/' + slug, { cache: 'no-store' }),
    create: (data: any) => request('/videos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/videos/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/videos/' + id, { method: 'DELETE' }),
  },
  exercises: {
    findByUnit: (unitId: string) => request<any[]>('/exercises/unit/' + unitId),
    create: (data: any) => request('/exercises', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/exercises/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/exercises/' + id, { method: 'DELETE' }),
  },
  events: {
    findAll: () => request<any[]>('/events', { cache: 'no-store' }),
    findUpcoming: () => request<any[]>('/events/upcoming', { cache: 'no-store' }),
    findPast: () => request<any[]>('/events/past', { cache: 'no-store' }),
    create: (data: any) => request('/events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/events/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/events/' + id, { method: 'DELETE' }),
  },
  pricing: {
    findAll: () => request<any[]>('/pricing', { cache: 'no-store' }),
    create: (data: any) => request('/pricing', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/pricing/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request('/pricing/' + id, { method: 'DELETE' }),
  },
  guides: {
    findByUnit: (unitId: string) => request<any>('/guides/unit/' + unitId),
    create: (data: any) => request('/guides', { method: 'POST', body: JSON.stringify(data) }),
  },
  progress: {
    complete: (userId: string, unitId: string) => request('/progress/complete', { method: 'POST', body: JSON.stringify({ userId, unitId }) }),
    getCourseProgress: (userId: string, courseSlug: string) => request<any>('/progress/' + userId + '/course/' + courseSlug),
  },
  certificates: {
    issue: (userId: string, courseSlug: string) => request('/certificates/issue', { method: 'POST', body: JSON.stringify({ userId, courseSlug }) }),
  },
  auth: {
    login: (email: string, password: string) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email: string, password: string, name?: string) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
    profile: (token: string) => request<any>('/auth/profile', { headers: { Authorization: 'Bearer ' + token } }),
  },
  sync: {
    importVideoPill: (data: any) => request('/sync/video-pill', { method: 'POST', body: JSON.stringify(data) }),
  },
}
