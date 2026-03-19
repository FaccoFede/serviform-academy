'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminForm.module.css'

/**
 * Admin Videos — form per creare una nuova video pillola.
 */
export default function AdminVideosPage() {
  const [title, setTitle] = useState('')
  const [youtubeId, setYoutubeId] = useState('')
  const [softwareId, setSoftwareId] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      await api.videos.create({
        title,
        youtubeId,
        softwareId,
        description: description || undefined,
      })
      setStatus('success')
      setTitle('')
      setYoutubeId('')
      setDescription('')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Errore nella creazione')
    }
  }

  return (
    <main className={styles.main}>
      <Link href="/admin" className={styles.back}>← Admin</Link>
      <h1 className={styles.title}>Nuova video pillola</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Titolo</label>
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es. Introduzione al modulo 3D"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>YouTube ID</label>
          <input
            className={styles.input}
            value={youtubeId}
            onChange={(e) => setYoutubeId(e.target.value)}
            placeholder="Es. zt4aT5oKLII"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Software ID</label>
          <input
            className={styles.input}
            value={softwareId}
            onChange={(e) => setSoftwareId(e.target.value)}
            placeholder="UUID del software"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Descrizione</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descrizione del video..."
          />
        </div>

        <button type="submit" className={styles.submit} disabled={status === 'loading'}>
          {status === 'loading' ? 'Creazione...' : 'Crea video pillola'}
        </button>

        {status === 'success' && <div className={styles.success}>Video pillola creata con successo.</div>}
        {status === 'error' && <div className={styles.error}>{errorMsg}</div>}
      </form>
    </main>
  )
}
