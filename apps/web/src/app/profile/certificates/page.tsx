'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
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
    software?: { name: string; color: string; lightColor: string }
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
}

function generateCertificatePdf(cert: Certificate, userName: string) {
  // Genera PDF inline via canvas → blob URL
  // Usa solo browser API, nessuna dipendenza esterna
  const canvas = document.createElement('canvas')
  canvas.width = 1122  // A4 landscape 96dpi
  canvas.height = 794
  const ctx = canvas.getContext('2d')!

  // Sfondo bianco
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 1122, 794)

  // Bordo decorativo
  ctx.strokeStyle = '#E63329'
  ctx.lineWidth = 6
  ctx.strokeRect(24, 24, 1074, 746)
  ctx.strokeStyle = '#003875'
  ctx.lineWidth = 1.5
  ctx.strokeRect(32, 32, 1058, 730)

  // Header Serviform Academy
  ctx.fillStyle = '#003875'
  ctx.font = 'bold 18px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('SERVIFORM ACADEMY', 561, 90)

  // Linea decorativa
  ctx.strokeStyle = '#E63329'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(200, 110)
  ctx.lineTo(922, 110)
  ctx.stroke()

  // "Attestato di Completamento"
  ctx.fillStyle = '#111111'
  ctx.font = 'bold 36px Arial'
  ctx.fillText('Attestato di Completamento', 561, 175)

  // "si certifica che"
  ctx.fillStyle = '#666666'
  ctx.font = '18px Arial'
  ctx.fillText('si certifica che', 561, 230)

  // Nome utente
  ctx.fillStyle = '#E63329'
  ctx.font = 'bold 44px Arial'
  ctx.fillText(userName, 561, 300)

  // "ha completato con successo il modulo"
  ctx.fillStyle = '#666666'
  ctx.font = '18px Arial'
  ctx.fillText('ha completato con successo il modulo formativo', 561, 355)

  // Titolo corso
  ctx.fillStyle = '#111111'
  ctx.font = 'bold 30px Arial'
  ctx.fillText(cert.course.title, 561, 415)

  // Software e livello
  const details = [
    cert.course.software?.name,
    cert.course.level,
    cert.course.duration,
  ].filter(Boolean).join(' · ')
  if (details) {
    ctx.fillStyle = '#888888'
    ctx.font = '16px Arial'
    ctx.fillText(details, 561, 455)
  }

  // Linea decorativa
  ctx.strokeStyle = '#003875'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(200, 490)
  ctx.lineTo(922, 490)
  ctx.stroke()

  // Data emissione
  ctx.fillStyle = '#444444'
  ctx.font = '14px Arial'
  ctx.fillText(`Emesso il ${formatDate(cert.issuedAt)}`, 561, 530)

  // ID certificato
  ctx.fillStyle = '#aaaaaa'
  ctx.font = '11px Arial'
  ctx.fillText(`ID: ${cert.id}`, 561, 560)

  // Footer
  ctx.fillStyle = '#888888'
  ctx.font = '13px Arial'
  ctx.fillText('Serviform S.r.l. · www.serviform.com', 561, 700)

  // Converti in blob e scarica
  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attestato-${cert.course.slug}-${cert.id.slice(0,8)}.png`
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
      .then(r => r.ok ? r.json() : [])
      .then(data => setCerts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const displayName = user
    ? (user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.name || user.email.split('@')[0])
    : 'Utente'

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.back}>← Dashboard</Link>
        <h1 className={styles.title}>I miei attestati</h1>
        <p className={styles.desc}>{certs.length} attestato{certs.length !== 1 ? 'i' : ''} conseguito{certs.length !== 1 ? 'i' : ''}</p>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {[1,2,3].map(i => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : certs.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🏅</div>
          <h3>Nessun attestato ancora</h3>
          <p>Completa tutti i moduli di un corso per ottenere il tuo attestato.</p>
          <Link href="/catalog" className={styles.emptyBtn}>Esplora i corsi →</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {certs.map(cert => {
            const brand = cert.course.software
            return (
              <div key={cert.id} className={styles.card}>
                {/* Badge header */}
                <div
                  className={styles.cardHeader}
                  style={{ background: brand?.lightColor || '#EEF3FA' }}
                >
                  <div className={styles.badge} style={{ borderColor: brand?.color || '#003875' }}>
                    <svg viewBox="0 0 40 40" fill="none" width={40} height={40}>
                      <circle cx="20" cy="20" r="18" stroke={brand?.color || '#003875'} strokeWidth="2"/>
                      <path d="M13 20l5 5 9-9" stroke={brand?.color || '#003875'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className={styles.softwareTag} style={{ background: brand?.color || '#003875', color: '#fff' }}>
                    {brand?.name || 'Serviform'}
                  </span>
                </div>

                {/* Body */}
                <div className={styles.cardBody}>
                  <div className={styles.certLabel}>Attestato di completamento</div>
                  <h3 className={styles.courseTitle}>{cert.course.title}</h3>
                  {cert.course.level && (
                    <span className={styles.level}>{cert.course.level}</span>
                  )}
                  <div className={styles.issuedAt}>
                    Conseguito il {formatDate(cert.issuedAt)}
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                  <Link href={`/courses/${cert.course.slug}`} className={styles.actionBtn}>
                    Rivedi il corso
                  </Link>
                  <button
                    className={styles.downloadBtn}
                    onClick={() => generateCertificatePdf(cert, displayName)}
                  >
                    ⬇ Scarica attestato
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
