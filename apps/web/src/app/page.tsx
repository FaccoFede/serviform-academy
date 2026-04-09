import Link from 'next/link'
import { api } from '@/lib/api'
import { SOFTWARE_BRANDS } from '@/lib/brands'
import styles from './page.module.css'

// ─── CONFIGURAZIONE CORSI IN EVIDENZA ────────────────────────────────────────
// Imposta qui gli slug dei corsi da mostrare nella sezione "Cosa trovi sulla
// piattaforma". Se vuoto, vengono mostrati automaticamente i primi 3 corsi.
// Esempio: const FEATURED_SLUGS = ['engview-3d', 'sysform-introduzione', 'projecto-primi-passi']
const FEATURED_SLUGS: string[] = []

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

  // ── Selezione corsi teaser ─────────────────────────────────────────────────
  // Se FEATURED_SLUGS è popolato, mostra quelli (nell'ordine indicato).
  // Altrimenti mostra i primi 3 in ordine di risposta API.
  let teaser: any[]
  if (FEATURED_SLUGS.length > 0) {
    teaser = FEATURED_SLUGS
      .map(slug => courses.find(c => c.slug === slug))
      .filter(Boolean)
      .slice(0, 3)
  } else {
    teaser = courses.slice(0, 3)
  }

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
              { n: stats.hours > 0 ? stats.hours + 'h+' : '—', l: 'ore di formazione' },
            ].map((s, i) => (
              <div key={i} className={styles.heroStat}>
                <span className={styles.heroStatN}>{s.n}</span>
                <span className={styles.heroStatL}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAMIGLIE SOFTWARE ─────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.sectionTag}>I software</div>
          <h2 className={styles.sectionTitle}>Scegli la tua famiglia</h2>
          <div className={styles.familyGrid}>
            {families.map(f => {
              const count = courses.filter(c => c.software?.slug === f.key).length
              return (
                <Link key={f.key} href={`/catalog?software=${f.key}`} className={styles.familyCard}>
                  <div className={styles.familyAccent} style={{ background: f.color }} />
                  <div className={styles.familyTop}>
                    <span className={styles.familyName} style={{ color: f.color }}>{f.name}</span>
                    <span className={styles.familyCount}>
                      {count > 0 ? `${count} cors${count === 1 ? 'o' : 'i'}` : 'coming soon'}
                    </span>
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
                // ── FIX TAG SOFTWARE ──────────────────────────────────────────
                // Legge lo slug reale dal campo software del corso.
                // Se lo slug non esiste in SOFTWARE_BRANDS, getBrand() restituisce
                // un fallback neutro (grigio) invece di forzare "EngView".
                const softwareSlug = c.software?.slug || ''
                const brand = SOFTWARE_BRANDS[softwareSlug] || {
                  name: c.software?.name || softwareSlug || 'N/D',
                  color: '#4E4D4D',
                  light: '#F5F5F5',
                }
                return (
                  <Link key={c.id} href={`/courses/${c.slug}`} className={styles.teaserCard}>
                    <div className={styles.teaserTop}>
                      <span
                        className={styles.teaserTag}
                        style={{ color: brand.color, background: brand.light }}
                      >
                        {brand.name}
                      </span>
                      {c.level && <span className={styles.teaserLevel}>{c.level}</span>}
                    </div>
                    <h3 className={styles.teaserTitle}>{c.title}</h3>
                    {c.description && <p className={styles.teaserDesc}>{c.description}</p>}

                    {/* ── FIX SEPARATORE DURATA / UNITÀ ─────────────────────── */}
                    <div className={styles.teaserFoot}>
                      {c.duration && <span>{c.duration}</span>}
                      {c.duration && c.units?.length > 0 && (
                        <span className={styles.teaserSep}>·</span>
                      )}
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
            ].map((s, i) => (
              <div key={i} className={styles.step}>
                <span className={styles.stepN}>{s.n}</span>
                <div className={styles.stepT}>{s.t}</div>
                <p className={styles.stepD}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINALE ────────────────────────────────────────── */}
      <section className={styles.sectionCta}>
        <div className={styles.inner}>
          <div className={styles.ctaBlock}>
            <h2 className={styles.ctaTitle}>Pronto a formarti?</h2>
            <p className={styles.ctaDesc}>
              Accedi con le tue credenziali Serviform e inizia subito il percorso.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/auth/login" className={styles.ctaRed}>Accedi ora →</Link>
              <Link href="/catalog" className={styles.ctaGhostLight}>Esplora il catalogo</Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
