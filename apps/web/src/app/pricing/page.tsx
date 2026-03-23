import { api } from '@/lib/api'
import styles from './PricingPage.module.css'

export default async function PricingPage() {
  let packages: any[] = []
  try { packages = await api.pricing.findAll() } catch {}

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1>Listino Prezzi</h1>
        <p>Formazione professionale per ogni esigenza. Moduli in autonomia, con formatore o pacchetti personalizzati.</p>
      </div>
      <div className={styles.grid}>
        {packages.map(pkg => (
          <div key={pkg.id} className={pkg.highlighted ? styles.cardFeatured : styles.card}>
            {pkg.highlighted && <span className={styles.badge}>Consigliato</span>}
            <div className={styles.cardHeader}>
              <h3 className={styles.planName}>{pkg.name}</h3>
              <div className={styles.price}>
                <span className={styles.amount}>{pkg.price || 'Su misura'}</span>
                {pkg.priceNote && <span className={styles.priceNote}>{pkg.priceNote}</span>}
              </div>
              {pkg.description && <p className={styles.tagline}>{pkg.description}</p>}
            </div>
            <div className={styles.cardBody}>
              <ul>
                {(pkg.features || []).map((f: string, i: number) => <li key={i}>{f}</li>)}
              </ul>
            </div>
            <div className={styles.cardFooter}>
              <a href={"mailto:support@serviform.com?subject=Richiesta pacchetto: " + pkg.name} className={pkg.highlighted ? styles.btnPrimary : styles.btnSecondary}>
                {pkg.price === 'Su misura' ? 'Contattaci' : 'Richiedi'}
              </a>
            </div>
          </div>
        ))}
      </div>

      {packages.length === 0 && (
        <p className={styles.empty}>Il listino prezzi verrà pubblicato a breve.</p>
      )}

      <section className={styles.contact}>
        <h2>Hai bisogno di un pacchetto personalizzato?</h2>
        <p>Contattaci per creare un piano su misura per il tuo team.</p>
        <a href="mailto:support@serviform.com?subject=Richiesta pacchetto personalizzato" className={styles.contactBtn}>
          <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 5l7 4 7-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          support@serviform.com
        </a>
      </section>
    </main>
  )
}
