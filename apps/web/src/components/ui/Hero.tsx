import styles from './Hero.module.css'

interface HeroProps { courseCount?: number; videoCount?: number; guideCount?: number; hoursCount?: string }

export default function Hero({ courseCount = 0, videoCount = 0, guideCount = 0, hoursCount = '0' }: HeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.bg} />
      <div className={styles.grid} />
      <div className={styles.content}>
        <div className={styles.eyebrow + ' fade-up'}>
          <span className={styles.dot} />
          piattaforma di formazione serviform
        </div>
        <h1 className="fade-up fade-up-1">padroneggia<br/><em>ogni strumento</em><br/>serviform.</h1>
        <p className="fade-up fade-up-2">moduli strutturati, video pillole, guide zendesk e consulenza<br/>per diventare esperto di EngView, Sysform e ProjectO.</p>
        <div className={styles.stats + ' fade-up fade-up-3'}>
          {[
            { n: courseCount + '+', l: 'moduli' },
            { n: videoCount, l: 'video pillole' },
            { n: guideCount, l: 'guide zendesk' },
            { n: hoursCount + 'h', l: 'formazione' },
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
