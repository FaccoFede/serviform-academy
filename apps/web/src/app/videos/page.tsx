import { redirect } from 'next/navigation'

/**
 * SCOPE CLEANUP: le videopillole sono fuori dal perimetro attivo.
 * La pagina /videos viene disabilitata con redirect verso homepage.
 * Il modulo backend VideosModule rimane isolato ma non esposto in navigazione.
 * Rivalutare in documento separato se riabilitare o rimuovere definitivamente.
 */
export default function VideosPage() {
  redirect('/')
}
