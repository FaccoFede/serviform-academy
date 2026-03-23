import type { Metadata } from 'next'
import { DM_Mono } from 'next/font/google'
import { Topbar, Rail, Shell } from '@/components/layout'
import { AuthProvider } from '@/context/AuthContext'
import { ProgressProvider } from '@/context/ProgressContext'
import '@/styles/globals.css'
import '@/styles/responsive.css'

const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'serviform academy.',
  description: 'piattaforma di formazione per EngView, Sysform e ProjectO.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={dmMono.variable}>
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
