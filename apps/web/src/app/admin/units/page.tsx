'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import AdminCrud from '@/components/features/AdminCrud'
import styles from './UnitsAdmin.module.css'

export default function AdminUnitsPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.courses.findAll().then(c => { setCourses(c); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <main className={styles.main}><p>Caricamento corsi...</p></main>

  if (!selectedCourse) {
    return (
      <main className={styles.main}>
        <Link href="/admin" className={styles.back}>← Admin</Link>
        <h1 className={styles.title}>Unità Didattiche</h1>
        <p className={styles.desc}>Seleziona un corso per gestire le sue unità:</p>
        <div className={styles.courseList}>
          {courses.map(c => (
            <button key={c.id} className={styles.courseCard} onClick={() => setSelectedCourse(c)}>
              <div className={styles.courseCardLeft}>
                {c.software?.color && <span className={styles.colorDot} style={{ background: c.software.color }}/>}
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.software?.name} — {c.units?.length || 0} unità</p>
                </div>
              </div>
              <svg viewBox="0 0 14 14" fill="none" width={14} height={14}><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <button className={styles.back} onClick={() => setSelectedCourse(null)}>← Tutti i corsi</button>
      <h1 className={styles.title}>{selectedCourse.title}</h1>
      <p className={styles.desc}>Unità del corso — puoi aggiungere contenuto HTML e URL video protetto</p>

      <AdminCrud
        title=""
        columns={[
          { key: 'order', label: '#' },
          { key: 'title', label: 'Titolo' },
          { key: 'unitType', label: 'Tipo' },
          { key: 'duration', label: 'Durata' },
          {
            key: 'videoUrl',
            label: 'Video',
            render: (v: any) => v ? (
              <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>▶ presente</span>
            ) : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>,
          },
        ]}
        fetchItems={() => api.units.findByCourse(selectedCourse.id)}
        onSave={(data) => api.units.create({ ...data, courseId: selectedCourse.id, order: parseInt(data.order) || 1 })}
        onUpdate={(id, data) => api.units.update(id, { ...data, order: data.order ? parseInt(data.order) : undefined })}
        onDelete={(id) => api.units.remove(id)}
        formFields={[
          { key: 'title', label: 'Titolo', type: 'text', required: true, placeholder: 'Es. Introduzione al modulo' },
          { key: 'order', label: 'Ordine', type: 'number', placeholder: '1' },
          {
            key: 'unitType', label: 'Tipo', type: 'select',
            options: [{ value: 'OVERVIEW', label: 'Overview (introduttiva)' }, { value: 'LESSON', label: 'Lezione' }, { value: 'EXERCISE', label: 'Esercitazione' }],
          },
          { key: 'subtitle', label: 'Sottotitolo', type: 'text', placeholder: 'Breve descrizione' },
          { key: 'duration', label: 'Durata', type: 'text', placeholder: 'Es. 15min' },
          {
            key: 'videoUrl',
            label: 'URL Video (embed protetto — Vimeo/Bunny/ecc.)',
            type: 'text',
            placeholder: 'https://player.vimeo.com/video/123456789 oppure https://iframe.mediadelivery.net/...',
          },
          {
            key: 'content',
            label: 'Contenuto HTML (editor testuale — incolla HTML o scrivi testo)',
            type: 'richtext',
            placeholder: '<h3>Titolo sezione</h3>\n<p>Contenuto della lezione...</p>\n<ul><li>Punto 1</li></ul>',
          },
        ]}
      />
    </main>
  )
}
