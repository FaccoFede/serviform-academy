import { redirect } from 'next/navigation'

/**
 * SCOPE CLEANUP: la pagina /pricing è stata rimossa dal perimetro Academy.
 * Redirect permanente verso la homepage per evitare link morti.
 */
export default function PricingPage() {
  redirect('/')
}
