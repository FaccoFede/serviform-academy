import type { Metadata } from 'next'
import { Syne, DM_Sans, DM_Mono } from 'next/font/google'
import { Topbar, Rail, Shell } from '@/components/layout'
import { AuthProvider } from '@/context/AuthContext'
import { ProgressProvider } from '@/context/ProgressContext'
import '@/styles/globals.css'
import '@/styles/responsive.css'

/**
 * Root Layout — layout principale dell'applicazione.
 *
 * Carica i font del design system e wrappa l'app con:
 * - AuthProvider: gestione autenticazione JWT
 * - ProgressProvider: tracciamento progresso unità
 * - Topbar + Rail + Shell: layout strutturale
 */

const syne = Syne({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Serviform Academy',
  description: 'Piattaforma di formazione per EngView, Sysform e ProjectO.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${syne.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <AuthProvider>
          <ProgressProvider>
            <Topbar />
            <Rail />
            <Shell>{children}</Shell>
          </ProgressProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
