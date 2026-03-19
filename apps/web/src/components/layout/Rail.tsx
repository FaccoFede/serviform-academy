'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Rail.module.css'

/**
 * Rail — barra di navigazione verticale a icone.
 *
 * Fissa a sinistra sotto la topbar, larghezza 64px.
 * Contiene icone con tooltip per le sezioni principali.
 * L'icona attiva è evidenziata in rosso.
 */

interface RailItem {
  href: string
  label: string
  icon: React.ReactNode
}

const RAIL_ITEMS: RailItem[] = [
  {
    href: '/',
    label: 'Corsi',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    href: '/videos',
    label: 'Video Pillole',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7.5 6.5l5 2.5-5 2.5V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/why',
    label: 'Perché Academy',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <path
          d="M9 2l1.8 4.8H16l-4 3 1.5 5L9 12l-4.5 2.8 1.5-5-4-3h5.2L9 2z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/pricing',
    label: 'Piani e Prezzi',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 8h6M6 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function Rail() {
  const pathname = usePathname()

  /** Determina se una rotta è attiva (supporta rotte annidate come /courses/xxx) */
  function isActive(href: string) {
    if (href === '/') {
      return pathname === '/' || pathname.startsWith('/courses')
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className={styles.rail}>
      {RAIL_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.btn} ${isActive(item.href) ? styles.btnActive : ''}`}
          data-tip={item.label}
        >
          {item.icon}
        </Link>
      ))}

      <div className={styles.spacer} />
      <div className={styles.divider} />

      {/* Settings (placeholder) */}
      <button className={styles.btn} data-tip="Impostazioni">
        <svg viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M9 2v2M9 14v2M2 9h2M14 9h2M4.1 4.1l1.4 1.4M12.5 12.5l1.4 1.4M4.1 13.9l1.4-1.4M12.5 5.5l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </nav>
  )
}
