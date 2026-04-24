'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { getBrand } from '@/lib/brands'
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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// Placeholder di download — la generazione completa dell'attestato verrà
// implementata in una sessione successiva. Manteniamo la logica canvas esistente
// come anteprima PNG finché non arriverà il vero PDF.
function downloadCertificate(cert: Certificate, userName: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 1122
  canvas.height = 794
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 1122, 794)

  ctx.strokeStyle = '#E63329'
  ctx.lineWidth = 6
  ctx.strokeRect(24, 24, 1074, 746)
  ctx.strokeStyle = '#1E1E1E'
  ctx.lineWidth = 1.5
  ctx.strokeRect(32, 32, 1058, 730)

  ctx.fillStyle = '#1E1E1E'
  ctx.font = 'bold 18px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('SERVIFORM ACADEMY', 561, 90)

  ctx.strokeStyle = '#E63329'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(200, 110)
  ctx.lineTo(922, 110)
  ctx.stroke()

  ctx.fillStyle = '#111111'
  ctx.font = 'bold 36px Arial'
  ctx.fillText('Attestato di completamento', 561, 175)

  ctx.fillStyle = '#666666'
  ctx.font = '18px Arial'
  ctx.fillText('si certifica che', 561, 230)

  ctx.fillStyle = '#E63329'
  ctx.font = 'bold 44px Arial'
  ctx.fillText(userName, 561, 300)

  ctx.fillStyle = '#666666'
  ctx.font = '18px Arial'
  ctx.fillText('ha completato con successo il modulo formativo', 561, 355)

  ctx.fillStyle = '#111111'
  ctx.font = 'bold 30px Arial'
  ctx.fillText(cert.course.title, 561, 415)

  const details = [cert.course.software?.name, cert.course.level, cert.course.duration]
    .filter(Boolean)
    .join(' · ')
  if (details) {
    ctx.fillStyle = '#888888'
    ctx.font = '16px Arial'
    ctx.fillText(details, 561, 455)
  }

  ctx.fillStyle = '#444444'
  ctx.font = '14px Arial'
  ctx.fillText(`Emesso il ${formatDate(cert.issuedAt)}`, 561, 530)

  ctx.fillStyle = '#aaaaaa'
  ctx.font = '11px Arial'
  ctx.fillText(`ID: ${cert.id}`, 561, 560)

  ctx.fillStyle = '#888888'
  ctx.font = '13px Arial'
  ctx.fillText('Serviform S.r.l. · www.serviform.com', 561, 700)

  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attestato-${cert.course.slug}-${cert.id.slice(0, 8)}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
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
                      onClick={() => downloadCertificate(cert, fullName)}
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
