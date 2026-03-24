'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Rail.module.css'

// SCOPE CLEANUP: rimosse video pillole, consulenza, eventi, listino.
// Rail ridotta a: Moduli (corsi) + separatore + Zendesk assistenza.
const ITEMS = [
  {
    href: '/',
    label: 'Moduli',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <path
          d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM10 10h5v5h-5z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

export default function Rail() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/' || pathname.startsWith('/courses')
    return pathname.startsWith(href)
  }

  return (
    <nav className={styles.rail}>
      {ITEMS.map((item) => (
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
          <path
            d="M7 7.5a2 2 0 114 0c0 1-1 1.5-2 2M9 13v.01"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </a>
    </nav>
  )
}
