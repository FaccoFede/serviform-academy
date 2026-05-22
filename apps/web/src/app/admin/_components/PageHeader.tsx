'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './PageHeader.module.css'

const BREADCRUMB_LABELS: Record<string, string> = {
  admin: 'Admin',
  courses: 'Corsi',
  units: 'Unità',
  exercises: 'Esercitazioni',
  software: 'Categorie',
  videos: 'Catalogo Video',
  guides: 'Catalogo Guide',
  companies: 'Aziende',
  users: 'Utenti',
  assignments: 'Assegnazioni',
  announcements: 'Comunicazioni & Eventi',
  certificates: 'Certificazioni',
  imports: 'Import CSV',
}

type Props = {
  title: string
  description?: string
  /** Slot per azione primaria a destra (es. bottone "Nuovo …") */
  action?: React.ReactNode
  /** Slot per chip/contatori sotto la descrizione */
  meta?: React.ReactNode
}

export default function PageHeader({ title, description, action, meta }: Props) {
  const pathname = usePathname()
  const segments = (pathname || '').split('/').filter(Boolean)
  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const label = BREADCRUMB_LABELS[seg] || seg
    return { href, label }
  })

  return (
    <header className={styles.root}>
      {crumbs.length > 1 && (
        <nav aria-label="Breadcrumb" className={styles.crumbs}>
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <span key={c.href} className={styles.crumb}>
                {isLast ? (
                  <span className={styles.crumbCurrent}>{c.label}</span>
                ) : (
                  <Link href={c.href} className={styles.crumbLink}>{c.label}</Link>
                )}
                {!isLast && <span className={styles.crumbSep}>/</span>}
              </span>
            )
          })}
        </nav>
      )}

      <div className={styles.row}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
          {meta && <div className={styles.meta}>{meta}</div>}
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </div>
    </header>
  )
}
