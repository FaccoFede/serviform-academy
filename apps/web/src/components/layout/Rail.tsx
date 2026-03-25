'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import styles from './Rail.module.css'

export default function Rail() {
  const pathname = usePathname()
  const { user } = useAuth()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  // Navigazione contestuale: diversa per auth e non-auth
  const items = user
    ? [
        {
          href: '/dashboard',
          label: 'Dashboard',
          icon: (
            <svg viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          ),
        },
        {
          href: '/catalog',
          label: 'Catalogo',
          icon: (
            <svg viewBox="0 0 18 18" fill="none">
              <path d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM10 10h5v5h-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          ),
        },
      ]
    : [
        {
          href: '/catalog',
          label: 'Catalogo',
          icon: (
            <svg viewBox="0 0 18 18" fill="none">
              <path d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM10 10h5v5h-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          ),
        },
      ]

  return (
    <nav className={styles.rail}>
      {/* Logo in cima */}
      <Link href={user ? '/dashboard' : '/'} className={styles.logoBtn} aria-label="Home">
        <svg viewBox="0 0 32 34" fill="none" width={22} height={22}>
          <circle cx="16" cy="19" r="14" fill="#E63329" />
          <circle cx="16" cy="21" r="6.5" fill="#000" />
          <polygon points="16,0 10.5,15 21.5,15" fill="#9D9D9C" />
        </svg>
      </Link>

      <div className={styles.divider} />

      {items.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={isActive(item.href) ? styles.btnActive : styles.btn}
          data-tip={item.label}
        >
          {item.icon}
        </Link>
      ))}

      <div className={styles.spacer} />
      <div className={styles.divider} />

      <a
        href="https://support.serviform.com"
        target="_blank"
        rel="noopener"
        className={styles.btn}
        data-tip="Assistenza Zendesk"
      >
        <svg viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3" />
          <path d="M7 7.5a2 2 0 114 0c0 1-1 1.5-2 2M9 13v.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </a>
    </nav>
  )
}
