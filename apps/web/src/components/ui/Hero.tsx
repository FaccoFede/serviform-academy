import styles from './Hero.module.css'

/**
 * Hero — sezione hero animata della homepage.
 *
 * Sfondo scuro con gradiente e griglia, contenuto sovrapposto.
 * Mostra: eyebrow badge, titolo grande, descrizione, statistiche.
 */
interface HeroProps {
  courseCount?: number
  unitCount?: number
  videoCount?: number
}

export default function Hero({
  courseCount = 0,
  unitCount = 0,
  videoCount = 0,
}: HeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.bg} />
      <div className={styles.grid} />

      <div className={styles.content}>
        <div className={`${styles.eyebrow} fade-up`}>
          <span className={styles.dot} />
          Piattaforma di apprendimento
        </div>

        <h1 className="fade-up fade-up-1">
          Padroneggia
          <br />
          <em>ogni strumento</em>
          <br />
          Serviform.
        </h1>

        <p className="fade-up fade-up-2">
          Corsi strutturati, video pillole mensili e guide interattive per
          diventare esperto di EngView, Sysform e ProjectO.
        </p>

        <div className={`${styles.stats} fade-up fade-up-3`}>
          <div className={styles.stat}>
            <div className={styles.num}>
              {courseCount}
              <span>+</span>
            </div>
            <div className={styles.label}>Corsi</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.num}>
              {unitCount}
              <span>+</span>
            </div>
            <div className={styles.label}>Unità</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.num}>{videoCount}</div>
            <div className={styles.label}>Video Pillole</div>
          </div>
        </div>
      </div>
    </section>
  )
}
