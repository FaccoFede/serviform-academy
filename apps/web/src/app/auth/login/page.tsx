'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import styles from './Login.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenziali non valide')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* LEFT — branding panel */}
      <div className={styles.brand}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <svg viewBox="0 0 32 34" fill="none" width={32} height={32}>
              <circle cx="16" cy="19" r="14" fill="#E63329"/>
              <circle cx="16" cy="21" r="6.5" fill="#000"/>
              <polygon points="16,0 10.5,15 21.5,15" fill="rgba(255,255,255,0.55)"/>
            </svg>
            <div className={styles.logoText}>
              <span className={styles.logoName}>Serviform</span>
              <span className={styles.logoProduct}>Academy</span>
            </div>
          </div>

          <div className={styles.brandHero}>
            <h1 className={styles.brandTitle}>
              La piattaforma<br/>
              di formazione<br/>
              <em>professionale.</em>
            </h1>
            <p className={styles.brandDesc}>
              Percorsi strutturati per EngView, Sysform,
              ProjectO e ServiformA. Impara, certifica, cresce.
            </p>
          </div>

          <div className={styles.brandStats}>
            {[['4', 'software'], ['50+', 'corsi'], ['200+', 'unità']].map(([n, l]) => (
              <div key={n} className={styles.brandStat}>
                <strong>{n}</strong>
                <span>{l}</span>
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
                <input className={styles.input} type="email" placeholder="email@azienda.it" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" autoFocus/>
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
                <input className={styles.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"/>
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                <svg viewBox="0 0 14 14" fill="none" width={13} height={13}><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4.5v2.5M7 9v.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            <button className={styles.btn} type="submit" disabled={loading}>
              {loading && <span className={styles.spin}/>}
              {loading ? 'Accesso...' : 'Accedi'}
            </button>
          </form>

          <p className={styles.contact}>
            Non hai accesso?{' '}
            <a href="mailto:support@serviform.com?subject=Richiesta accesso Academy">Contatta Serviform →</a>
          </p>
        </div>

        <p className={styles.legal}>
          L'accesso è consentito solo agli utenti autorizzati. Le attività sono registrate e monitorate.
        </p>
      </div>
    </div>
  )
}
