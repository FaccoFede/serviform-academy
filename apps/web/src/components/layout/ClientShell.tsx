'use client'

import { AuthProvider } from '@/context/AuthContext'
import { ProgressProvider } from '@/context/ProgressContext'
import Topbar from './Topbar'
import Rail from './Rail'
import Shell from './Shell'

/**
 * ClientShell — unico boundary 'use client' per l'intera shell.
 * Contiene tutti i provider e i componenti di layout che usano hooks.
 * Il RootLayout server-side importa solo questo.
 */
export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProgressProvider>
        <Rail />
        <Topbar />
        <Shell>{children}</Shell>
      </ProgressProvider>
    </AuthProvider>
  )
}
