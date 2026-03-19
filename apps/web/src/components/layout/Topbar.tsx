'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Topbar.module.css'

interface NavItem {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Corsi', href: '/' },
  { label: 'Video Pillole', href: '/videos' },
  { label: 'Perché Academy', href: '/why' },
  { label: 'Piani', href: '/pricing' },
]

export default function Topbar() {
  const pathname = usePathname()

  return (
    <header className={styles.topbar}>
      <Link href="/" className={styles.logoMark}>
        <svg viewBox="0 0 16 16" fill="none" width={16} height={16}>
          <path
            d="M3 8l4 4 6-7"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>

      <Link href="/" className={styles.brandName}>
        Serviform <span>Academy</span>
      </Link>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${
              pathname === item.href ? styles.navLinkActive : ''
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={styles.right}>
        <span className={styles.pill}>Beta</span>
        <Link href="/pricing" className={styles.cta}>
          Abbonati →
        </Link>
      </div>
    </header>
  )
}
