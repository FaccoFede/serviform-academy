'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import styles from './Topbar.module.css'

const NAV_PUBLIC = [
  { label: 'catalogo', href: '/catalog' },
]

const NAV_AUTH = [
  { label: 'dashboard', href: '/dashboard' },
  { label: 'catalogo', href: '/catalog' },
]

export default function Topbar() {
  const pathname = usePathname()
  const { user, logout, isLoading } = useAuth()

  const nav = user ? NAV_AUTH : NAV_PUBLIC

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <header className={styles.bar}>
      <Link href={user ? '/dashboard' : '/'} className={styles.brand}>
        serviform <span>academy</span>
      </Link>

      <nav className={styles.nav}>
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(item.href) ? styles.active : styles.link}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={styles.right}>
        <a
          href="https://support.serviform.com"
          target="_blank"
          rel="noopener"
          className={styles.support}
        >
          <svg viewBox="0 0 16 16" fill="none" width={13} height={13}>
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 6.5a2 2 0 114 0c0 1-1 1.5-2 2M8 11.5v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          assistenza
        </a>

        {!isLoading && (
          user ? (
            <div className={styles.userMenu}>
              <span className={styles.userName}>
                {user.firstName || (user.name || '').split(' ')[0] || user.email.split('@')[0]}
              </span>
              <button className={styles.logoutBtn} onClick={logout}>
                esci
              </button>
            </div>
          ) : (
            <Link href="/auth/login" className={styles.cta}>accedi</Link>
          )
        )}
      </div>
    </header>
  )
}
