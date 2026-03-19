import Link from 'next/link'
import styles from './AdminPage.module.css'

/**
 * Admin dashboard — hub di navigazione per la gestione contenuti.
 *
 * Permette di accedere alle sezioni di gestione
 * senza accesso diretto al database.
 */

const ADMIN_SECTIONS = [
  { href: '/admin/software', label: 'Gestione software', desc: 'EngView, Sysform, ProjectO' },
  { href: '/admin/courses', label: 'Gestione corsi', desc: 'Crea e modifica i corsi' },
  { href: '/admin/units', label: 'Gestione unità', desc: 'Unità didattiche dei corsi' },
  { href: '/admin/videos', label: 'Gestione video pillole', desc: 'Video pillole YouTube' },
]

export default function AdminPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Admin Serviform Academy</h1>
      <p className={styles.desc}>Gestisci i contenuti della piattaforma.</p>

      <div className={styles.grid}>
        {ADMIN_SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className={styles.card}>
            <h3 className={styles.cardTitle}>{section.label}</h3>
            <p className={styles.cardDesc}>{section.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
