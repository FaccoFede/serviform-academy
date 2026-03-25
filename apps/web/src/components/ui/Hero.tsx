import styles from './Hero.module.css'

interface HeroProps {
  courseCount?: number
  unitCount?: number
  guideCount?: number
}

// SCOPE CLEANUP: rimosso videoCount dalla props e dalle statistiche.
// Le statistiche ora mostrano: corsi, unità, guide Zendesk.
export default function Hero({ courseCount = 0, unitCount = 0, guideCount = 0 }: HeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.bg} />
      <div className={styles.grid} />
      <div className={styles.content}>
        <div className={styles.eyebrow + ' fade-up'}>
          <span className={styles.dot} />
          piattaforma di formazione serviform
        </div>
        <h1 className="fade-up fade-up-1">
          padroneggia
          <br />
          <em>ogni strumento</em>
          <br />
          serviform.
        </h1>
        <p className="fade-up fade-up-2">
          moduli strutturati, guide zendesk e percorsi certificati
          <br />
          per diventare esperto di EngView, Sysform, ProjectO e ServiformA.
        </p>
        <div className={styles.stats + ' fade-up fade-up-3'}>
          {[
            { n: courseCount + '+', l: 'moduli' },
            { n: unitCount + '+', l: 'unità didattiche' },
            { n: guideCount + '+', l: 'guide zendesk' },
          ].map((s, i) => (
            <div key={i} className={styles.stat}>
              <div className={styles.num}>{s.n}</div>
              <div className={styles.label}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
