'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import AdminCrud from '@/components/features/AdminCrud'
import styles from './UnitsAdmin.module.css'

/**
 * Admin Unità — le unità sono raggruppate per corso.
 *
 * L'utente prima seleziona un corso dalla lista,
 * poi vede e gestisce le unità di quel corso specifico.
 * Questo evita confusione con centinaia di unità miste.
 */
export default function AdminUnitsPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.courses.findAll().then(c => { setCourses(c); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <main className={styles.main}><p>Caricamento corsi...</p></main>

  // Se nessun corso selezionato, mostra la lista corsi
  if (!selectedCourse) {
    return (
      <main className={styles.main}>
        <Link href="/admin" className={styles.back}>
          <svg viewBox="0 0 14 14" fill="none" width={14} height={14}><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Admin
        </Link>
        <h1 className={styles.title}>Unità Didattiche</h1>
        <p className={styles.desc}>Seleziona un corso per gestire le sue unità:</p>

        <div className={styles.courseList}>
          {courses.map(c => (
            <button key={c.id} className={styles.courseCard} onClick={() => setSelectedCourse(c)}>
              <div className={styles.courseCardLeft}>
                {c.software?.color && <span className={styles.colorDot} style={{ background: c.software.color }} />}
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.software?.name} — {c.units?.length || 0} unità</p>
                </div>
              </div>
              <svg viewBox="0 0 14 14" fill="none" width={14} height={14}><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          ))}
          {courses.length === 0 && <p className={styles.empty}>Nessun corso. Crea prima un corso dalla sezione Moduli.</p>}
        </div>
      </main>
    )
  }

  // Corso selezionato: mostra CRUD delle unità di quel corso
  return (
    <div>
      <div className={styles.courseHeader}>
        <button className={styles.backBtn} onClick={() => setSelectedCourse(null)}>
          <svg viewBox="0 0 14 14" fill="none" width={14} height={14}><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Tutti i corsi
        </button>
        <div className={styles.courseInfo}>
          {selectedCourse.software?.color && <span className={styles.colorDot} style={{ background: selectedCourse.software.color }} />}
          <span className={styles.courseName}>{selectedCourse.title}</span>
          <span className={styles.courseSw}>{selectedCourse.software?.name}</span>
        </div>
      </div>

      <AdminCrud
        title={"Unità di: " + selectedCourse.title}
        columns={[
          { key: 'order', label: '#' },
          { key: 'title', label: 'Titolo' },
          { key: 'unitType', label: 'Tipo', render: (v: any) => ({ OVERVIEW: 'Panoramica', LESSON: 'Lezione', EXERCISE: 'Esercitazione' }[v as string] || v) },
          { key: 'duration', label: 'Durata' },
          { key: 'slug', label: 'Slug' },
        ]}
        fetchItems={async () => {
          const course = await api.courses.findBySlug(selectedCourse.slug)
          return course.units || []
        }}
        onSave={(data) => api.units.create({ ...data, courseId: selectedCourse.id })}
        onUpdate={(id, data) => api.units.update(id, data)}
        onDelete={(id) => api.units.remove(id)}
        formFields={[
          { key: 'title', label: 'Titolo unità', type: 'text', required: true },
          { key: 'subtitle', label: 'Sottotitolo', type: 'text', placeholder: 'Breve descrizione' },
          { key: 'order', label: 'Ordine (numero)', type: 'number', required: true },
          { key: 'unitType', label: 'Tipo', type: 'select', required: true, options: [
            { value: 'OVERVIEW', label: 'Panoramica (introduzione al modulo)' },
            { value: 'LESSON', label: 'Lezione (contenuto didattico)' },
            { value: 'EXERCISE', label: 'Esercitazione (pratica finale)' },
          ]},
          { key: 'duration', label: 'Durata stimata', type: 'text', placeholder: 'Es. 15 min' },
          { key: 'content', label: 'Contenuto (HTML)', type: 'richtext', placeholder: 'Inserisci il contenuto formattato in HTML...' },
        ]}
        emptyMessage={"Nessuna unità per " + selectedCourse.title + ". Clicca \"Nuovo\" per creare la prima."}
      />
    </div>
  )
}
