import styles from './WhyPage.module.css'

export default function WhyPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}><span className={styles.dot} />Perché sceglierci</div>
          <h1>Apprendi <em>più veloce</em>,<br/>applica subito.</h1>
          <p>Niente più video generici su YouTube. Formazione strutturata, percorsi guidati e contenuti aggiornati mensile su ogni prodotto Serviform.</p>
        </div>
      </section>

      <section className={styles.valueProps}>
        {[
          { icon: '⭐', title: 'Percorsi strutturati', desc: 'Ogni corso è progettato con una sequenza logica di unità che ti porta dalla base alla padronanza.' },
          { icon: '🎯', title: 'Contenuti pratici', desc: 'Esercitazioni reali, checklist operative e guide di riferimento Zendesk per ogni argomento.' },
          { icon: '📊', title: 'Tracciamento progresso', desc: 'Monitora il tuo avanzamento, completa le unità e ottieni certificati al termine di ogni corso.' },
        ].map((vp, i) => (
          <div key={i} className={styles.valueProp}>
            <div className={styles.vpIcon}>{vp.icon}</div>
            <h3 className={styles.vpTitle}>{vp.title}</h3>
            <p className={styles.vpDesc}>{vp.desc}</p>
          </div>
        ))}
      </section>

      <section className={styles.statsBand}>
        {[
          { num: '3', label: 'Software' },
          { num: '50+', label: 'Unità didattiche' },
          { num: '9', label: 'Video pillole' },
          { num: '12', label: 'Guide Zendesk' },
        ].map((s, i) => (
          <div key={i} className={styles.statItem}>
            <div className={styles.statNum}>{s.num}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </section>

      <section className={styles.features}>
        <h2 className={styles.featuresTitle}>Come funziona</h2>
        <div className={styles.featureGrid}>
          {[
            { num: '01', title: 'Scegli il software', desc: 'Seleziona il prodotto Serviform su cui vuoi formarti: EngView, Sysform o ProjectO.' },
            { num: '02', title: 'Segui il percorso', desc: 'Completa le unità didattiche in sequenza, con video, guide e contenuti interattivi.' },
            { num: '03', title: 'Pratica con le esercitazioni', desc: 'Metti in pratica ciò che hai imparato con esercitazioni guidate e checklist operative.' },
            { num: '04', title: 'Ottieni il certificato', desc: 'Al completamento di tutte le unità ricevi il certificato di competenza sul software.' },
          ].map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <span className={styles.fcNum}>{f.num}</span>
              <h3 className={styles.fcTitle}>{f.title}</h3>
              <p className={styles.fcDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
