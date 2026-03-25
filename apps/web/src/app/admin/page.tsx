import Link from 'next/link'
import styles from './AdminPage.module.css'

/**
 * Admin Panel — hub di governo completo della piattaforma.
 * Struttura B2B: corsi, aziende, utenti, assegnazioni, annunci, import, Zendesk.
 * SCOPE CLEANUP: rimosse card Video Pillole, Listino Prezzi, Eventi.
 */

const SECTIONS = [
  {
    group: 'Contenuti',
    items: [
      {
        href: '/admin/courses',
        label: 'Corsi',
        desc: 'Crea, modifica e pubblica i moduli di formazione',
        icon: <svg viewBox="0 0 24 24" fill="none" width={22} height={22}><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      },
      {
        href: '/admin/units',
        label: 'Unità didattiche',
        desc: 'Gestisci le unità raggruppate per corso',
        icon: <svg viewBox="0 0 24 24" fill="none" width={22} height={22}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      },
      {
        href: '/admin/software',
        label: 'Software',
        desc: 'EngView, Sysform, ProjectO, ServiformA — colori e tagline',
        icon: <svg viewBox="0 0 24 24" fill="none" width={22} height={22}><rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 21h10M12 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      },
    ],
  },
  {
    group: 'Organizzazione',
    items: [
      {
        href: '/admin/companies',
        label: 'Aziende',
        desc: 'Anagrafica clienti, contratti, scadenze e software di interesse',
        icon: <svg viewBox="0 0 24 24" fill="none" width={22} height={22}><path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21v-4h6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      },
      {
        href: '/admin/users',
        label: 'Utenti',
        desc: 'Gestisci gli account, i ruoli e le aziende di appartenenza',
        icon: <svg viewBox="0 0 24 24" fill="none" width={22} height={22}><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      },
      {
        href: '/admin/assignments',
        label: 'Assegnazioni',
        desc: 'Assegna corsi ad aziende e utenti, gestisci scadenze e visibilità',
        icon: <svg viewBox="0 0 24 24" fill="none" width={22} height={22}><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      },
    ],
  },
  {
    group: 'Comunicazione',
    items: [
      {
        href: '/admin/announcements',
        label: 'Annunci',
        desc: 'Pubblica novità, nuovi corsi, webinar e comunicazioni',
        icon: <svg viewBox="0 0 24 24" fill="none" width={22} height={22}><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      },
      {
        href: '/admin/zendesk',
        label: 'Zendesk',
        desc: 'Collega unità didattiche a guide Zendesk e viceversa',
        icon: <svg viewBox="0 0 24 24" fill="none" width={22} height={22}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-1.5 2-2.5 3M12 17v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      },
    ],
  },
  {
    group: 'Operazioni',
    items: [
      {
        href: '/admin/imports',
        label: 'Import CSV',
        desc: 'Importa aziende e utenti in blocco tramite file CSV',
        icon: <svg viewBox="0 0 24 24" fill="none" width={22} height={22}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      },
      {
        href: '/admin/exercises',
        label: 'Esercitazioni',
        desc: 'File HTML 3D e .evd scaricabili per le esercitazioni pratiche',
        icon: <svg viewBox="0 0 24 24" fill="none" width={22} height={22}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      },
    ],
  },
]

export default function AdminPage() {
  return (
    <main className={styles.main}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Admin Panel</h1>
        <p className={styles.desc}>Governo completo di Serviform Academy.</p>
      </div>

      <div className={styles.groups}>
        {SECTIONS.map((section) => (
          <div key={section.group} className={styles.group}>
            <h2 className={styles.groupTitle}>{section.group}</h2>
            <div className={styles.grid}>
              {section.items.map((s) => (
                <Link key={s.href} href={s.href} className={styles.card}>
                  <div className={styles.cardIcon}>{s.icon}</div>
                  <div>
                    <h3 className={styles.cardTitle}>{s.label}</h3>
                    <p className={styles.cardDesc}>{s.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
