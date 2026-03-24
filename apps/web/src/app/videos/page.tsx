import { redirect } from 'next/navigation'

/**
 * /videos — DISABILITATA
 *
 * Le videopillole sono fuori scope nel progetto corrente.
 * (DOCX sez. 18: "videopillole disabilitate")
 * (doc 02_scope: "disattivare videopillole dalla UX principale")
 *
 * Il modulo backend `videos` resta nel codice ma non è esposto nella UX.
 * Per riabilitare in futuro: creare un documento separato di re-enable
 * come indicato in DOCX sez. 18.2.
 */
export default function VideosPage() {
  redirect('/')
}
