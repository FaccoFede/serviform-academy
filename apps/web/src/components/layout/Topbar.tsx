'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Topbar.module.css'

/**
 * Topbar — navigazione principale.
 *
 * Requisiti (DOCX sez. 6):
 * - login dal pulsante in alto a destra
 * - separazione chiara area pubblica / area personale
 *
 * Decisioni (02_scope_and_cleanup):
 * - NO pricing nella navigation
 * - NO consulting nella navigation
 * - NO videopillole nella navigation
 *
 * Nota: quando auth sarà implementata (Task 2+), il bottone login
 * diventerà condizionale: mostra "accedi" se non autenticato,
 * mostra nome utente + menu se autenticato.
 */

const NAV_ITEMS = [
  { label: 'moduli', href: '/' },
]

export default function Topbar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname.startsWith('/courses')
    return pathname.startsWith(href)
  }

  return (
    <header className={styles.topbar}>
      {/* Logo punzone Serviform — icona più riconoscibile del brand */}
      <Link href="/" className={styles.logo} aria-label="Home">
        <svg viewBox="0 0 32 34" fill="none" width={24} height={24}>
          <circle cx="16" cy="19" r="14" fill="#E63329" />
          <circle cx="16" cy="21" r="6.5" fill="currentColor" />
          <polygon points="16,0 10.5,15 21.5,15" fill="#9D9D9C" />
        </svg>
      </Link>

      <Link href="/" className={styles.brand}>
        serviform <span className={styles.brandAccent}>academy</span>
      </Link>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(item.href) ? styles.navActive : styles.navLink}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Login CTA — punto di ingresso esplicito per autenticazione (DOCX sez. 6) */}
      <div className={styles.right}>
        <Link href="/login" className={styles.loginBtn}>
          accedi
        </Link>
      </div>
    </header>
  )
}
