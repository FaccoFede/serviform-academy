import type { Metadata } from 'next'
import { DM_Mono } from 'next/font/google'
import Topbar from '@/components/layout/Topbar'
import '@/styles/globals.css'

/**
 * Root Layout.
 *
 * Font:
 * - Bergen Sans: caricato via @font-face in globals.css (font proprietario Serviform)
 * - DM Mono: caricato via next/font/google (per badge e dati tecnici)
 *
 * Bergen Sans SemiBold (600) = body default
 * Bergen Sans Bold (700) = titoli e CTA
 * Regular (400) NON va usato — indicazione del brand kit.
 */

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-next',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'serviform academy.',
  description:
    'Piattaforma di formazione per EngView, Sysform, ProjectO e ServiformA.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className={dmMono.variable}>
      <body>
        <Topbar />
        <main style={{ paddingTop: 'var(--topbar-h)' }}>{children}</main>
      </body>
    </html>
  )
}
