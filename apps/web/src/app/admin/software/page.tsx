'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminForm.module.css'

/**
 * Admin Software — form per creare un nuovo software.
 *
 * Usa il client API centralizzato.
 * Mostra feedback di successo/errore strutturato.
 */
export default function AdminSoftwarePage() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      await api.software.create({ name, slug })
      setStatus('success')
      setName('')
      setSlug('')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Errore nella creazione')
    }
  }

  return (
    <main className={styles.main}>
      <Link href="/admin" className={styles.back}>
        ← Admin
      </Link>

      <h1 className={styles.title}>Nuovo software</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Nome</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es. EngView"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Slug</label>
          <input
            className={styles.input}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Es. engview"
            required
          />
        </div>

        <button
          type="submit"
          className={styles.submit}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Creazione...' : 'Crea software'}
        </button>

        {status === 'success' && (
          <div className={styles.success}>Software creato con successo.</div>
        )}
        {status === 'error' && (
          <div className={styles.error}>{errorMsg}</div>
        )}
      </form>
    </main>
  )
}
