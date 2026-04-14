import Link from 'next/link'
import styles from './AdminPage.module.css'

/**
 * Home admin — raggruppa le sezioni per area funzionale.
 * Include le nuove aree: Catalogo Video, Catalogo Guide, Certificazioni.
 */
const SECTIONS = [
  {
    group: 'Contenuti formativi',
    items: [
      { href: '/admin/courses', label: 'Corsi', desc: 'Crea, modifica e pubblica i moduli' },
      { href: '/admin/units', label: 'Unità didattiche', desc: 'Contenuto HTML, video e guide' },
      { href: '/admin/exercises', label: 'Esercitazioni', desc: 'File HTML 3D e .evd scaricabili' },
      { href: '/admin/software', label: 'Prodotti Academy', desc: 'EngView, Sysform, ProjectO, ServiformA' },
    ],
  },
  {
    group: 'Librerie riutilizzabili',
    items: [
      { href: '/admin/videos', label: 'Catalogo Video', desc: 'Upload file o registra URL esterni' },
      { href: '/admin/guides', label: 'Catalogo Guide', desc: 'Guide Zendesk con titolo automatico' },
    ],
  },
  {
    group: 'Organizzazione',
    items: [
      { href: '/admin/companies', label: 'Aziende', desc: 'Anagrafica, contratti, preferenze portale' },
      { href: '/admin/users', label: 'Utenti', desc: 'Account, ruoli, reset password' },
      { href: '/admin/assignments', label: 'Assegnazioni', desc: 'Assegna corsi ad aziende e utenti' },
    ],
  },
  {
    group: 'Comunicazione & Eventi',
    items: [
      { href: '/admin/announcements', label: 'Comunicazioni', desc: 'Novità, comunicati, regole' },
      { href: '/admin/events', label: 'Calendario eventi', desc: 'Workshop, webinar e sessioni live' },
    ],
  },
  {
    group: 'Progressi & Certificazioni',
    items: [
      { href: '/admin/certificates', label: 'Certificazioni', desc: 'Badge emessi automaticamente al completamento' },
    ],
  },
]

export default function AdminPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Pannello di amministrazione</h1>
      <p className={styles.desc}>Serviform Academy — gestione completa della piattaforma.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36, marginTop: 32 }}>
        {SECTIONS.map((s) => (
          <div key={s.group}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: 'var(--muted)',
                fontFamily: 'var(--font-mono)',
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: '1px solid var(--border)',
              }}
            >
              {s.group}
            </div>
            <div className={styles.grid}>
              {s.items.map((item) => (
                <Link key={item.href} href={item.href} className={styles.card}>
                  <h3 className={styles.cardTitle}>{item.label}</h3>
                  <p className={styles.cardDesc}>{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
