/**
 * Configurazione API centralizzata.
 *
 * Sostituisce tutti i `http://localhost:3001` hardcoded nelle pagine.
 * In produzione: impostare NEXT_PUBLIC_API_URL nell'environment.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Fetch helper con base URL pre-configurato.
 * Usa `no-store` di default per evitare cache durante lo sviluppo.
 */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`
  const res = await fetch(url, {
    cache: 'no-store',
    ...options,
  })

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${url}`)
  }

  return res.json()
}
