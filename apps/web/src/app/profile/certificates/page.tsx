'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { getBrand } from '@/lib/brands'
import { formatDate } from '@/lib/formatters'
import { downloadCertificateA4 } from '@/lib/certificate'
import styles from './CertificatesPage.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Certificate {
  id: string
  issuedAt: string
  course: {
    id: string
    title: string
    slug: string
    level?: string
    duration?: string
    software?: {
      slug: string
      name: string
      color: string
      lightColor: string
    }
  }
}

export default function CertificatesPage() {
  const { user, token } = useAuth()
  const [certs, setCerts] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch(API_URL + '/certificates/my', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(r => (r.ok ? r.json() : []))
      .then(data => setCerts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const fullName = user
    ? user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.name || user.email.split('@')[0]
    : 'Utente'

  const initial = (fullName[0] || '?').toUpperCase()

  return (
    <div className={styles.page}>
      {/* ── Header utente ──────────────────────────────────────────── */}
      <header className={styles.profileHeader}>
        <Link href="/profile" className={styles.back}>
          ← Profilo
        </Link>

        <div className={styles.profileRow}>
          <div className={styles.avatar} aria-hidden="true">
            <span>{initial}</span>
          </div>

          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>{fullName}</h1>
            <p className={styles.profileSubtitle}>
              {loading
                ? 'Caricamento dei tuoi riconoscimenti…'
                : certs.length > 0
                  ? `${certs.length} badge ${certs.length === 1 ? 'conseguito' : 'conseguiti'}`
                  : 'Nessun badge conseguito'}
            </p>
          </div>
        </div>
      </header>

      {/* ── Griglia badge ──────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Badge e attestati</h2>
          <p className={styles.sectionDesc}>
            Un badge viene rilasciato automaticamente al completamento di un corso.
          </p>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {[1, 2, 3].map(i => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : certs.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <Image src="/logo.svg" alt="" width={48} height={48} />
            </div>
            <h3>Nessun attestato ancora</h3>
            <p>Completa tutti i moduli di un corso per ottenere il tuo badge.</p>
            <Link href="/catalog" className={styles.emptyBtn}>
              Esplora i corsi →
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {certs.map(cert => {
              const brand = getBrand(cert.course.software?.slug, cert.course.software)
              const familyColor = brand.color || '#E63329'
              const familyLight = brand.light || '#FFF1F0'
              const familyName = brand.name || cert.course.software?.name || 'Serviform'

              return (
                <article key={cert.id} className={styles.card}>
                  {/* Head: logo + Serviform Academy */}
                  <div className={styles.cardHead}>
                    <Image
                      src="/logo.svg"
                      alt=""
                      width={20}
                      height={20}
                      className={styles.cardLogo}
                    />
                    <span className={styles.cardBrand}>Serviform Academy</span>
                  </div>

                  {/* Badge medaglia */}
                  <div className={styles.badgeWrap}>
                    <div
                      className={styles.badgeRing}
                      style={{ background: familyLight, borderColor: familyColor }}
                    >
                      <div
                        className={styles.badgeInner}
                        style={{ background: `linear-gradient(140deg, ${familyColor}, #1E1E1E)` }}
                      >
                        <Image
                          src="/logo.svg"
                          alt=""
                          width={36}
                          height={36}
                          className={styles.badgeLogo}
                        />
                      </div>
                      <span
                        className={styles.badgeCheck}
                        style={{ background: familyColor }}
                        aria-label="Completato"
                      >
                        <svg viewBox="0 0 14 14" fill="none" width={12} height={12}>
                          <path
                            d="M3 7.2l2.8 2.8L11 4.8"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Body: famiglia + titolo + data */}
                  <div className={styles.cardBody}>
                    <span className={styles.family} style={{ color: familyColor }}>
                      {familyName}
                    </span>
                    <h3 className={styles.courseTitle}>{cert.course.title}</h3>
                    {cert.course.level && (
                      <span className={styles.level}>{cert.course.level}</span>
                    )}
                    <div className={styles.issued}>
                      Conseguito il {formatDate(cert.issuedAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.downloadBtn}
                      onClick={() => downloadCertificateA4(cert, fullName)}
                    >
                      Scarica attestato
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
