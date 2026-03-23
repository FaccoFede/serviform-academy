'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Topbar.module.css'

const NAV = [
  { label: 'moduli', href: '/' },
  { label: 'video pillole', href: '/videos' },
  { label: 'consulenza', href: '/consulting' },
  { label: 'eventi', href: '/events' },
  { label: 'listino', href: '/pricing' },
]

export default function Topbar() {
  const pathname = usePathname()
  const isActive = (href: string) => href === '/' ? (pathname === '/' || pathname.startsWith('/courses')) : pathname.startsWith(href)

  return (
    <header className={styles.bar}>
      <Link href="/" className={styles.logo}>
        <svg viewBox="0 0 32 34" fill="none" width={24} height={24}>
          <circle cx="16" cy="19" r="14" fill="#E63329"/>
          <circle cx="16" cy="21" r="6.5" fill="#000"/>
          <polygon points="16,0 10.5,15 21.5,15" fill="#9D9D9C"/>
        </svg>
      </Link>
      <Link href="/" className={styles.brand}>serviform <span>academy</span></Link>
      <nav className={styles.nav}>
        {NAV.map(item => (
          <Link key={item.href} href={item.href} className={isActive(item.href) ? styles.active : styles.link}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className={styles.right}>
        <a href="https://support.serviform.com" target="_blank" rel="noopener" className={styles.support}>
          <svg viewBox="0 0 16 16" fill="none" width={14} height={14}><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 6.5a2 2 0 114 0c0 1-1 1.5-2 2M8 11.5v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          assistenza
        </a>
        <Link href="/pricing" className={styles.cta}>listino prezzi</Link>
      </div>
    </header>
  )
}
