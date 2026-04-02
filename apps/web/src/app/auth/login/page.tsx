'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import styles from './Login.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Stats {
  software: number
  courses: number
  units: number
}

export default function LoginPage() {
  const { login, user, isLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<Stats>({ software: 4, courses: 0, units: 0 })

  // Redirect se già loggato
  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard')
  }, [isLoading, user, router])

  // Carica statistiche reali dal backend
  useEffect(() => {
    Promise.allSettled([
      fetch(API_URL + '/software').then(r => r.ok ? r.json() : []),
      fetch(API_URL + '/courses').then(r => r.ok ? r.json() : []),
    ]).then(([swRes, coRes]) => {
      const software = swRes.status === 'fulfilled' ? (swRes.value?.length ?? 4) : 4
      const courses = coRes.status === 'fulfilled' ? (coRes.value?.length ?? 0) : 0
      const units = coRes.status === 'fulfilled'
        ? (coRes.value as any[]).reduce((acc: number, c: any) => acc + (c.units?.length ?? 0), 0)
        : 0
      setStats({ software, courses, units })
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Credenziali non valide')
    } finally {
      setLoading(false)
    }
  }

  const statItems = [
    { value: stats.software.toString(), label: 'software' },
    { value: stats.courses > 0 ? stats.courses + (stats.courses >= 10 ? '+' : '') : '—', label: 'corsi' },
    { value: stats.units > 0 ? stats.units + (stats.units >= 50 ? '+' : '') : '—', label: 'unità' },
  ]

  return (
    <div className={styles.page}>
      {/* LEFT — brand panel */}
      <div className={styles.brand}>
        <div className={styles.brandContent}>
          {/* Logo */}
          <div className={styles.logo}>
            <svg viewBox="0 0 32 32" fill="none" width={32} height={32}>
              <circle cx="16" cy="16" r="15" stroke="#E63329" strokeWidth="2"/>
              <path d="M10 11 C10 8 13 6 16 6 C19 6 21 8 21 11 C21 14 19 16 16 16 C13 16 11 18 11 21 C11 24 13 26 16 26 C19 26 22 24 22 21"
                stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            </svg>
            <div className={styles.logoText}>
              <span className={styles.logoName}>Serviform</span>
              <span className={styles.logoProduct}>Academy</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className={styles.brandTitle}>
            La piattaforma<br/>
            di formazione<br/>
            <em>professionale.</em>
          </h1>

          <p className={styles.brandDesc}>
            Percorsi strutturati per EngView, Sysform, ProjectO e
            ServiformA. Impara, certifica, cresce.
          </p>

          {/* Stats reali */}
          <div className={styles.brandStats}>
            {statItems.map(({ value, label }) => (
              <div key={label} className={styles.brandStat}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* decorative shapes */}
        <div className={styles.deco1}/>
        <div className={styles.deco2}/>
        <div className={styles.decoGrid}/>
      </div>

      {/* RIGHT — form panel */}
      <div className={styles.formPanel}>
        <div className={styles.formBox}>
          <h2 className={styles.formTitle}>Accedi al tuo account</h2>
          <p className={styles.formSub}>Inserisci le tue credenziali per continuare</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Indirizzo email</label>
              <div className={styles.inputRow}>
                <svg className={styles.inputIco} viewBox="0 0 16 16" fill="none" width={14} height={14}>
                  <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M2 6l6 4 6-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="email@azienda.it"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputRow}>
                <svg className={styles.inputIco} viewBox="0 0 16 16" fill="none" width={14} height={14}>
                  <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="8" cy="11" r="1.2" fill="currentColor"/>
                </svg>
                <input
                  className={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7 4.5v2.5M7 9v.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button className={styles.btn} type="submit" disabled={loading}>
              {loading && <span className={styles.spin}/>}
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          <p className={styles.formFooter}>
            Non hai accesso?{' '}
            <a href="mailto:support@serviform.com?subject=Richiesta accesso Academy" className={styles.formLink}>
              Contatta Serviform →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
