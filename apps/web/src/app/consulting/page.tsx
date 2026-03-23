import styles from './ConsultingPage.module.css'

export default function ConsultingPage() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}>
            <svg viewBox="0 0 16 16" fill="none" width={14} height={14}><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            Consulenza personalizzata
          </div>
          <h1>Formazione <em>su misura</em> per la tua azienda</h1>
          <p>Lavora direttamente con un formatore Serviform sui tuoi progetti reali. Analisi, ottimizzazione e supporto one-to-one.</p>
        </div>
      </section>

      <section className={styles.services}>
        {[
          { icon: '🔍', title: 'Analisi progetto', desc: 'Il formatore analizza i tuoi file EngView/Sysform e suggerisce ottimizzazioni specifiche per i tuoi prodotti.' },
          { icon: '⚙️', title: 'Ottimizzazione workflow', desc: 'Revisione del processo produttivo e configurazione ottimale dei software Serviform per il tuo flusso di lavoro.' },
          { icon: '🛠️', title: 'Troubleshooting', desc: 'Risoluzione di problemi specifici con supporto diretto del formatore sui tuoi file e configurazioni.' },
        ].map((s, i) => (
          <div key={i} className={styles.serviceCard}>
            <span className={styles.serviceIcon}>{s.icon}</span>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </section>

      <section className={styles.cta}>
        <h2>Richiedi una consulenza</h2>
        <p>Contattaci per concordare una sessione personalizzata con un formatore esperto.</p>
        <a href="mailto:support@serviform.com?subject=Richiesta consulenza Serviform Academy" className={styles.ctaBtn}>
          <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 5l7 4 7-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          Scrivi a support@serviform.com
        </a>
      </section>
    </main>
  )
}
