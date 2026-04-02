import Link from 'next/link'
import { api } from '@/lib/api'
import { SOFTWARE_BRANDS } from '@/lib/brands'
import styles from './page.module.css'

export default async function PublicHomePage() {
  let courses: any[] = []
  try { courses = await api.courses.findAll() } catch {}

  // Calcola ore totali di formazione sommando le durate dei corsi
  function parseDurationToHours(d?: string): number {
    if (!d) return 0
    const h = d.match(/(\d+(?:[.,]\d+)?)\s*h/i)
    const m = d.match(/(\d+)\s*min/i)
    return (h ? parseFloat(h[1].replace(',', '.')) : 0) + (m ? parseInt(m[1]) / 60 : 0)
  }
  const totalHours = Math.round(courses.reduce((s, c) => s + parseDurationToHours(c.duration), 0))

  const stats = {
    courses: courses.length,
    units: courses.reduce((s, c) => s + (c.units?.length || 0), 0),
    hours: totalHours,
  }
  const teaser = courses.slice(0, 3)
  const families = Object.values(SOFTWARE_BRANDS)

  return (
    <div className={styles.page}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>SERVIFORM ACADEMY</div>
          <h1 className={styles.heroTitle}>
            Ogni strumento Serviform.<br/>
            <span>Padroneggiato.</span>
          </h1>
          <p className={styles.heroSub}>
            Percorsi strutturati per EngView, Sysform, ProjectO e ServiformA.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/catalog" className={styles.ctaBlack}>Esplora i corsi →</Link>
            <Link href="/auth/login" className={styles.ctaGhost}>Accedi</Link>
          </div>
          <div className={styles.heroStats}>
            {[
              { n: stats.courses + '+', l: 'corsi' },
              { n: stats.units + '+', l: 'unità didattiche' },
              { n: stats.hours > 0 ? stats.hours + 'h+' : '∞', l: 'ore di formazione' }
            ].map((s, i) => (
              <div key={i} className={styles.heroStat}>
                <span className={styles.heroStatN}>{s.n}</span>
                <span className={styles.heroStatL}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOFTWARE ──────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.sectionTag}>Percorsi formativi</div>
          <h2 className={styles.sectionTitle}>Un percorso per ogni competenza</h2>
          <div className={styles.familyGrid}>
            {families.map(f => {
              const count = courses.filter(c => c.software?.slug === f.key).length
              return (
                <Link key={f.key} href={`/catalog?family=${f.key}`} className={styles.familyCard}
                  style={{ '--fc': f.color, '--fl': f.light } as React.CSSProperties}>
                  <div className={styles.familyAccent} style={{ background: f.color }} />
                  <div className={styles.familyTop}>
                    <span className={styles.familyName}>{f.name}</span>
                    <span className={styles.familyCount}>{count > 0 ? `${count} cors${count === 1 ? 'o' : 'i'}` : 'coming soon'}</span>
                  </div>
                  <p className={styles.familyTagline}>{f.tagline}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── TEASER CORSI ──────────────────────────────────────── */}
      {teaser.length > 0 && (
        <section className={styles.sectionDark}>
          <div className={styles.inner}>
            <div className={styles.sectionRow}>
              <div>
                <div className={styles.sectionTagLight}>In catalogo</div>
                <h2 className={styles.sectionTitleLight}>Cosa trovi sulla piattaforma</h2>
              </div>
              <Link href="/catalog" className={styles.seeAll}>Tutto il catalogo →</Link>
            </div>
            <div className={styles.teaserGrid}>
              {teaser.map(c => {
                const brand = SOFTWARE_BRANDS[c.software?.slug || ''] || SOFTWARE_BRANDS.engview
                return (
                  <Link key={c.id} href={`/courses/${c.slug}`} className={styles.teaserCard}>
                    <div className={styles.teaserTop}>
                      <span className={styles.teaserTag} style={{ color: brand.color, background: brand.light }}>{brand.name}</span>
                      {c.level && <span className={styles.teaserLevel}>{c.level}</span>}
                    </div>
                    <h3 className={styles.teaserTitle}>{c.title}</h3>
                    {c.description && <p className={styles.teaserDesc}>{c.description}</p>}
                    <div className={styles.teaserFoot}>
                      {c.duration && <span>{c.duration}</span>}
                      {c.units?.length > 0 && <span>{c.units.length} unità</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── COME FUNZIONA ─────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.sectionTag}>Come funziona</div>
          <h2 className={styles.sectionTitle}>Dalla registrazione alla certificazione</h2>
          <div className={styles.stepsGrid}>
            {[
              { n: '01', t: 'Esplora', d: 'Sfoglia il catalogo per software o livello. Anteprima gratuita sulle prime unità.' },
              { n: '02', t: 'Studia', d: 'Unità brevi con contenuto HTML e video. Guide Zendesk integrate per ogni argomento.' },
              { n: '03', t: 'Certifica', d: 'Completa tutte le unità e ottieni il tuo attestato verificabile.' },
            ].map(s => (
              <div key={s.n} className={styles.step}>
                <span className={styles.stepN}>{s.n}</span>
                <h3 className={styles.stepT}>{s.t}</h3>
                <p className={styles.stepD}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA AZIENDALE ─────────────────────────────────────── */}
      <section className={styles.sectionCta}>
        <div className={styles.inner}>
          <div className={styles.ctaBlock}>
            <div className={styles.sectionTagLight}>Per le aziende</div>
            <h2 className={styles.ctaTitle}>Forma tutto il tuo team!</h2>
            <br></br>
            <div className={styles.heroCtas}>
              <Link href="/auth/login" className={styles.ctaRed}>Accedi alla piattaforma</Link>
              <a href="mailto:support@serviform.com?subject=Richiesta accesso Academy" className={styles.ctaGhostLight}>Richiedi accesso →</a>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
