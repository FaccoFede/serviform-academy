'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import styles from './LoginPage.module.css'

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
      setError(err instanceof Error ? err.message : 'Errore di accesso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.logo}>
          serviform <span>academy</span>
        </Link>

        <h1 className={styles.title}>Accedi</h1>
        <p className={styles.sub}>Inserisci le tue credenziali per accedere alla piattaforma.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              placeholder="email@azienda.it"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className={styles.error}>
              <svg viewBox="0 0 16 16" fill="none" width={14} height={14}>
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className={styles.spinner} />
                Accesso in corso...
              </>
            ) : 'Accedi'}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Non hai accesso alla piattaforma?{' '}
            <a href="mailto:support@serviform.com?subject=Richiesta accesso Academy" className={styles.footerLink}>
              Contatta Serviform
            </a>
          </p>
        </div>
      </div>

      {/* Sfondo decorativo */}
      <div className={styles.bg} />
    </main>
  )
}
