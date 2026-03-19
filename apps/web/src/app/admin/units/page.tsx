'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminForm.module.css'

/**
 * Admin Units — form per creare una nuova unità didattica.
 *
 * Lo slug viene generato automaticamente dal backend
 * a partire dal titolo (con anti-collision).
 */
export default function AdminUnitsPage() {
  const [title, setTitle] = useState('')
  const [order, setOrder] = useState(1)
  const [courseId, setCourseId] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      await api.units.create({ title, order, courseId })
      setStatus('success')
      setTitle('')
      setOrder(order + 1)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Errore nella creazione')
    }
  }

  return (
    <main className={styles.main}>
      <Link href="/admin" className={styles.back}>← Admin</Link>
      <h1 className={styles.title}>Nuova unità</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Titolo</label>
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es. Struttura dell'ambiente 3D"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Ordine</label>
          <input
            className={styles.input}
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            min={1}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Course ID</label>
          <input
            className={styles.input}
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            placeholder="UUID del corso"
            required
          />
        </div>

        <button type="submit" className={styles.submit} disabled={status === 'loading'}>
          {status === 'loading' ? 'Creazione...' : 'Crea unità'}
        </button>

        {status === 'success' && <div className={styles.success}>Unità creata con successo.</div>}
        {status === 'error' && <div className={styles.error}>{errorMsg}</div>}
      </form>
    </main>
  )
}
