import Link from 'next/link'
import styles from './AdminPage.module.css'

const SECTIONS = [
  { group: 'Contenuti', items: [
    { href: '/admin/courses', label: 'Corsi', desc: 'Crea, modifica e pubblica i moduli' },
    { href: '/admin/units', label: 'Unità didattiche', desc: 'Gestisci unità con contenuto HTML e video' },
    { href: '/admin/software', label: 'Software', desc: 'EngView, Sysform, ProjectO, ServiformA' },
  ]},
  { group: 'Organizzazione', items: [
    { href: '/admin/companies', label: 'Aziende', desc: 'Anagrafica clienti, contratti, scadenze' },
    { href: '/admin/users', label: 'Utenti', desc: 'Gestisci account, ruoli e appartenenze' },
    { href: '/admin/assignments', label: 'Assegnazioni', desc: 'Assegna corsi ad aziende con scadenza' },
  ]},
  { group: 'Comunicazione', items: [
    { href: '/admin/announcements', label: 'Annunci', desc: 'Pubblica novità e comunicazioni' },
    { href: '/admin/exercises', label: 'Esercitazioni', desc: 'File HTML 3D e .evd scaricabili' },
  ]},
]

export default function AdminPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Admin Panel</h1>
      <p className={styles.desc}>Governo completo di Serviform Academy.</p>
      <div style={{display:'flex',flexDirection:'column',gap:36,marginTop:32}}>
        {SECTIONS.map(s=>(
          <div key={s.group}>
            <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'var(--muted)',fontFamily:'var(--font-mono)',marginBottom:14,paddingBottom:10,borderBottom:'1px solid var(--border)'}}>{s.group}</div>
            <div className={styles.grid}>
              {s.items.map(item=>(
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
