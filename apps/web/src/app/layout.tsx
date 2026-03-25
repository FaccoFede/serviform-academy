import type { Metadata } from 'next'
import { DM_Mono } from 'next/font/google'
import ClientShell from '@/components/layout/ClientShell'
import '@/styles/globals.css'
import '@/styles/responsive.css'

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Serviform Academy',
  description: 'Piattaforma di formazione B2B per EngView, Sysform, ProjectO e ServiformA.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={dmMono.variable}>
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  )
}
