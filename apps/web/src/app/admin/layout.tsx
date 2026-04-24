'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import styles from './AdminLayout.module.css'

const NAV = [
  {
    group: 'Contenuti',
    items: [
      { href: '/admin/courses', label: 'Corsi' },
      { href: '/admin/units', label: 'Unità' },
      { href: '/admin/exercises', label: 'Esercitazioni' },
      { href: '/admin/software', label: 'Software' },
    ],
  },
  {
    group: 'Librerie',
    items: [
      { href: '/admin/videos', label: 'Catalogo Video' },
      { href: '/admin/guides', label: 'Catalogo Guide' },
    ],
  },
  {
    group: 'Organizzazione',
    items: [
      { href: '/admin/companies', label: 'Aziende' },
      { href: '/admin/users', label: 'Utenti' },
      { href: '/admin/assignments', label: 'Assegnazioni' },
    ],
  },
  {
    group: 'Comunicazioni',
    items: [
      { href: '/admin/announcements', label: 'Comunicazioni' },
      { href: '/admin/events', label: 'Calendario' },
    ],
  },
  {
    group: 'Progressi',
    items: [
      { href: '/admin/certificates', label: 'Certificazioni' },
      { href: '/admin/imports', label: 'Import CSV' },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }
    if (user.role !== 'ADMIN' && user.role !== 'TEAM_ADMIN') {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading) return (
    <div style={{ padding: 80, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
      Verifica accesso...
    </div>
  )

  if (!user || (user.role !== 'ADMIN' && user.role !== 'TEAM_ADMIN')) return null

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand}>
          <span className={styles.brandDot} />
          <span className={styles.brandLabel}>Admin Panel</span>
        </Link>

        <nav className={styles.nav}>
          {NAV.map((group) => (
            <div key={group.group} className={styles.group}>
              <span className={styles.groupLabel}>{group.group}</span>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    pathname?.startsWith(item.href)
                      ? `${styles.navItem} ${styles.active}`
                      : styles.navItem
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <Link href="/dashboard" className={styles.footerLink}>
            <svg viewBox="0 0 14 14" fill="none" width={11} height={11}>
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Torna al portale
          </Link>
        </div>
      </aside>

      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
