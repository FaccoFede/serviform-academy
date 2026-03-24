import { redirect } from 'next/navigation'

/**
 * SCOPE CLEANUP: la pagina /consulting è stata rimossa dal perimetro Academy.
 * Redirect permanente verso la homepage per evitare link morti.
 */
export default function ConsultingPage() {
  redirect('/')
}
