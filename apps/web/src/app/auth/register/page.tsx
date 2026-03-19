'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import styles from '../AuthPage.module.css'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(email, password, name || undefined)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di registrazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.logo}>Serviform <span>Academy</span></div>
        <h1 className={styles.title}>Registrati</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input className={styles.input} type="text" placeholder="Nome (opzionale)" value={name} onChange={e => setName(e.target.value)} />
          <input className={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className={styles.input} type="password" placeholder="Password (min 6 caratteri)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          {error && <div className={styles.error}>{error}</div>}
          <button className={styles.submit} type="submit" disabled={loading}>{loading ? 'Registrazione...' : 'Crea account'}</button>
        </form>
        <p className={styles.link}>Hai già un account? <Link href="/auth/login">Accedi</Link></p>
      </div>
    </main>
  )
}
