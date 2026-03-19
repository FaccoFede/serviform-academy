import styles from './PricingPage.module.css'

const PLANS = [
  {
    name: 'STARTER', price: '0', currency: '€', period: '/mese', featured: false,
    tagline: 'Accesso base per esplorare la piattaforma e provare i contenuti.',
    features: ['1 corso gratuito', 'Video pillole pubbliche', 'Guide di riferimento', 'Certificato base'],
    btnLabel: 'Inizia gratis', btnStyle: 'outline' as const,
  },
  {
    name: 'TEAM', price: '29', currency: '€', period: '/mese per utente', featured: true,
    tagline: 'Per team che vogliono formare gli operatori su tutti i software Serviform.',
    features: ['Tutti i corsi', 'Video pillole esclusive', 'Esercitazioni guidate', 'Certificati avanzati', 'Progresso team', 'Supporto prioritario'],
    btnLabel: 'Abbonati ora', btnStyle: 'primary' as const,
  },
  {
    name: 'ENTERPRISE', price: 'Custom', currency: '', period: '', featured: false,
    tagline: 'Per grandi organizzazioni con esigenze specifiche di formazione.',
    features: ['Tutto il piano Team', 'Contenuti personalizzati', 'SSO e integrazione HR', 'Corsi branded on-demand', 'Customer Success dedicato', 'SLA garantito'],
    btnLabel: 'Contattaci', btnStyle: 'secondary' as const,
  },
]

export default function PricingPage() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1>Scegli il tuo piano</h1>
        <p>Formazione professionale per ogni esigenza, dal singolo utente al team enterprise.</p>
      </div>
      <div className={styles.grid}>
        {PLANS.map((plan) => (
          <div key={plan.name} className={`${styles.card} ${plan.featured ? styles.featured : ''}`}>
            {plan.featured && <span className={styles.badge}>Consigliato</span>}
            <div className={styles.planHeader}>
              <div className={styles.planName}>{plan.name}</div>
              <div className={styles.planPrice}>
                {plan.currency && <span className={styles.currency}>{plan.currency}</span>}
                <span className={styles.amount}>{plan.price}</span>
                {plan.period && <span className={styles.period}>{plan.period}</span>}
              </div>
              <p className={styles.tagline}>{plan.tagline}</p>
            </div>
            <div className={styles.planBody}>
              <ul className={styles.featureList}>
                {plan.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
            <div className={styles.planFooter}>
              <button className={`${styles.btn} ${styles[plan.btnStyle]}`}>{plan.btnLabel}</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
