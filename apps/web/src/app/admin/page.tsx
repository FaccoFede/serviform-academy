import Link from 'next/link'
import styles from './AdminPage.module.css'

/**
 * Admin Dashboard — hub di navigazione per la gestione dei contenuti.
 *
 * SCOPE CLEANUP:
 * - rimossa card "Video Pillole" (fuori scope attivo)
 * - rimossa card "Listino Prezzi" (fuori scope definitivo)
 * - rimossa card "Eventi" (fuori scope, da rivalutare separatamente)
 * - mantenute: Software, Corsi, Unità, Esercitazioni
 */

const SECTIONS = [
  {
    href: '/admin/software',
    label: 'Software',
    desc: 'Modifica colori, tagline e configurazione dei software (EngView, Sysform, ProjectO, ServiformA)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 21h10M12 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/admin/courses',
    label: 'Moduli / Corsi',
    desc: 'Crea, modifica ed elimina i moduli di formazione',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <path
          d="M4 19.5A2.5 2.5 0 016.5 17H20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/admin/units',
    label: 'Unità didattiche',
    desc: 'Gestisci le unità raggruppate per corso',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/admin/exercises',
    label: 'Esercitazioni',
    desc: 'File HTML 3D e .evd scaricabili per le esercitazioni',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

export default function AdminPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Admin Panel</h1>
      <p className={styles.desc}>Gestisci tutti i contenuti di Serviform Academy.</p>

      <div className={styles.grid}>
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className={styles.card}>
            <div className={styles.cardIcon}>{s.icon}</div>
            <div>
              <h3 className={styles.cardTitle}>{s.label}</h3>
              <p className={styles.cardDesc}>{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
