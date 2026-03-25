import Link from 'next/link'
import { api } from '@/lib/api'
import { SOFTWARE_BRANDS } from '@/lib/brands'
import styles from './page.module.css'

/**
 * Homepage pubblica — landing commerciale.
 *
 * NON è il catalogo. È la pagina di valore/conversione.
 * Struttura:
 *   1. Hero con headline forte + stats + CTA
 *   2. Famiglie software (4 card)
 *   3. Anteprima corsi (teaser, non catalogo completo)
 *   4. Come funziona (3 step)
 *   5. CTA finale
 */
export default async function PublicHomePage() {
  let courses: any[] = []
  try {
    courses = await api.courses.findAll()
  } catch {
    // graceful degradation
  }

  const stats = {
    courses: courses.length,
    units: courses.reduce((s, c) => s + (c.units?.length || 0), 0),
    families: 4,
    guides: courses.reduce((s, c) => s + (c.units?.filter((u: any) => u.guide).length || 0), 0),
  }

  // Mostra max 4 corsi come teaser (solo quelli published)
  const teaserCourses = courses.slice(0, 4)

  const families = Object.values(SOFTWARE_BRANDS)

  return (
    <div className={styles.page}>

      {/* ── 1. HERO ──────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroGrid} />
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroEyebrow}>
              <span className={styles.heroDot} />
              piattaforma di formazione b2b serviform
            </div>
            <h1 className={styles.heroTitle}>
              forma il tuo team.<br />
              <em>padroneggia ogni</em><br />
              software serviform.
            </h1>
            <p className={styles.heroSub}>
              Percorsi strutturati, guide integrate con Zendesk e attestati verificabili
              per EngView, Sysform, ProjectO e ServiformA.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/catalog" className={styles.ctaPrimary}>
                Esplora il catalogo
                <svg viewBox="0 0 16 16" fill="none" width={16} height={16}>
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/auth/login" className={styles.ctaSecondary}>
                Accedi alla piattaforma
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.heroStats}>
            {[
              { n: stats.courses + '+', l: 'corsi disponibili' },
              { n: stats.units + '+', l: 'unità didattiche' },
              { n: stats.families, l: 'famiglie software' },
              { n: stats.guides + '+', l: 'guide Zendesk' },
            ].map((s, i) => (
              <div key={i} className={styles.heroStat}>
                <span className={styles.heroStatNum}>{s.n}</span>
                <span className={styles.heroStatLabel}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. FAMIGLIE SOFTWARE ─────────────────────────────── */}
      <section className={styles.familiesSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Software supportati</span>
            <h2 className={styles.sectionTitle}>
              Formazione per ogni prodotto Serviform
            </h2>
            <p className={styles.sectionSub}>
              Quattro famiglie software, percorsi dedicati, livelli progressivi.
            </p>
          </div>

          <div className={styles.familiesGrid}>
            {families.map((f) => {
              const count = courses.filter(c => c.software?.slug === f.key).length
              return (
                <Link
                  key={f.key}
                  href={`/catalog?family=${f.key}`}
                  className={styles.familyCard}
                  style={{ '--f-color': f.color, '--f-light': f.light, '--f-border': f.border } as React.CSSProperties}
                >
                  <div className={styles.familyAccent} />
                  <div className={styles.familyBadge} style={{ background: f.light, color: f.color }}>
                    {f.name}
                  </div>
                  <h3 className={styles.familyTitle}>{f.name}</h3>
                  <p className={styles.familyTagline}>{f.tagline}</p>
                  <div className={styles.familyFooter}>
                    <span className={styles.familyCount}>
                      {count > 0 ? `${count} cors${count === 1 ? 'o' : 'i'}` : 'in arrivo'}
                    </span>
                    <span className={styles.familyArrow}>→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 3. ANTEPRIMA CORSI ───────────────────────────────── */}
      {teaserCourses.length > 0 && (
        <section className={styles.teaserSection}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeaderRow}>
              <div>
                <span className={styles.sectionEyebrow}>Corsi in catalogo</span>
                <h2 className={styles.sectionTitle}>Cosa trovi sulla piattaforma</h2>
              </div>
              <Link href="/catalog" className={styles.seeAllLink}>
                Vedi tutto il catalogo →
              </Link>
            </div>

            <div className={styles.teaserGrid}>
              {teaserCourses.map((course) => {
                const brand = SOFTWARE_BRANDS[course.software?.slug || ''] || SOFTWARE_BRANDS.engview
                return (
                  <div
                    key={course.id}
                    className={styles.teaserCard}
                    style={{ '--f-color': brand.color, '--f-light': brand.light } as React.CSSProperties}
                  >
                    <div className={styles.teaserTopLine} />
                    <span className={styles.teaserTag} style={{ background: brand.light, color: brand.color }}>
                      {brand.name}
                    </span>
                    <h3 className={styles.teaserTitle}>{course.title}</h3>
                    {course.description && (
                      <p className={styles.teaserDesc}>{course.description}</p>
                    )}
                    <div className={styles.teaserMeta}>
                      {course.duration && <span>{course.duration}</span>}
                      {course.level && <span>{course.level}</span>}
                      {course.units?.length > 0 && <span>{course.units.length} unità</span>}
                    </div>
                    <div className={styles.teaserLock}>
                      <svg viewBox="0 0 16 16" fill="none" width={14} height={14}>
                        <rect x="2" y="7" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M5 7V5.5a3 3 0 016 0V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      Accedi per iniziare
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 4. COME FUNZIONA ─────────────────────────────────── */}
      <section className={styles.howSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Come funziona</span>
            <h2 className={styles.sectionTitle}>Un percorso chiaro, dall'inizio alla certificazione</h2>
          </div>
          <div className={styles.howGrid}>
            {[
              {
                n: '01',
                title: 'Scegli il corso',
                desc: 'Esplora il catalogo per famiglia software e livello. Ogni corso mostra struttura, durata e obiettivi.',
              },
              {
                n: '02',
                title: 'Studia a ritmo tuo',
                desc: 'Unità brevi, guide Zendesk collegate, esercitazioni pratiche con file reali. Riprendi sempre da dove sei rimasto.',
              },
              {
                n: '03',
                title: 'Ottieni l\'attestato',
                desc: 'Completa tutte le unità e ottieni l\'attestato di partecipazione. Traccia il progresso della tua azienda.',
              },
            ].map((step) => (
              <div key={step.n} className={styles.howStep}>
                <span className={styles.howNum}>{step.n}</span>
                <h3 className={styles.howTitle}>{step.title}</h3>
                <p className={styles.howDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CTA FINALE ────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className={styles.sectionInner}>
          <div className={styles.ctaBox}>
            <div className={styles.ctaBg} />
            <div className={styles.ctaContent}>
              <span className={styles.sectionEyebrow} style={{ color: 'rgba(255,255,255,0.4)' }}>
                Per le aziende
              </span>
              <h2 className={styles.ctaTitle}>
                Porta la formazione Serviform<br />nel tuo team
              </h2>
              <p className={styles.ctaSub}>
                Assegna corsi, monitora l'avanzamento, gestisci scadenze.<br />
                Importa il tuo team via CSV e parti in pochi minuti.
              </p>
              <div className={styles.heroCtas}>
                <Link href="/auth/login" className={styles.ctaPrimary}>
                  Accedi alla piattaforma
                </Link>
                <a
                  href="mailto:support@serviform.com?subject=Richiesta accesso Academy"
                  className={styles.ctaSecondaryLight}
                >
                  Richiedi accesso per la tua azienda
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
