'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminForm.module.css'

/**
 * Admin Courses — form per creare un nuovo corso.
 */
export default function AdminCoursesPage() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [softwareId, setSoftwareId] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      await api.courses.create({
        title,
        slug,
        description: description || undefined,
        softwareId,
      })
      setStatus('success')
      setTitle('')
      setSlug('')
      setDescription('')
      setSoftwareId('')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Errore nella creazione')
    }
  }

  return (
    <main className={styles.main}>
      <Link href="/admin" className={styles.back}>← Admin</Link>
      <h1 className={styles.title}>Nuovo corso</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Titolo</label>
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es. Modulo 3D"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Slug</label>
          <input
            className={styles.input}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Es. engview-3d"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Descrizione</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrizione del corso..."
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

        <button type="submit" className={styles.submit} disabled={status === 'loading'}>
          {status === 'loading' ? 'Creazione...' : 'Crea corso'}
        </button>

        {status === 'success' && <div className={styles.success}>Corso creato con successo.</div>}
        {status === 'error' && <div className={styles.error}>{errorMsg}</div>}
      </form>
    </main>
  )
}
