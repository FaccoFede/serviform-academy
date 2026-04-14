'use client'

import AdminCrud from '@/components/features/AdminCrud'
import { api } from '@/lib/api'

/**
 * Admin Corsi — gestione con publishState e thumbnailUrl configurabile.
 * publishState: HIDDEN | VISIBLE_LOCKED | PUBLISHED
 * thumbnailUrl: opzionale, se vuoto usa placeholder automatico dal brand software
 * duration: calcolata automaticamente dalla somma delle durate delle unità del corso
 */
export default function AdminCoursesPage() {
  return (
    <AdminCrud
      title="Moduli / Corsi"
      columns={[
        {
          key: 'thumbnailUrl',
          label: '',
          render: (v: any, row: any) => v
            ? <img src={v} alt="" style={{ width: 40, height: 28, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }} />
            : <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>auto</span>,
        },
        { key: 'title', label: 'Titolo' },
        { key: 'slug', label: 'Slug' },
        { key: 'level', label: 'Livello' },
        { key: 'duration', label: 'Durata' },
        {
          key: 'publishState',
          label: 'Stato',
          render: (v: any) => ({
            HIDDEN: '⚫ Nascosto',
            VISIBLE_LOCKED: '🔒 Visibile bloccato',
            PUBLISHED: '✅ Pubblicato',
          }[v as string] || v),
        },
        { key: 'software', label: 'Software', render: (_: any, row: any) => row.software?.name || '—' },
      ]}
      fetchItems={api.courses.findAll}
      onSave={(data) => api.courses.create(data)}
      onUpdate={(id, data) => api.courses.update(id, data)}
      onDelete={(id) => api.courses.remove(id)}
      formFields={[
        { key: 'title', label: 'Titolo modulo', type: 'text', required: true, placeholder: 'Es. Modulo 3D' },
        { key: 'slug', label: 'Slug (URL)', type: 'text', required: true, placeholder: 'Es. engview-3d' },
        { key: 'description', label: 'Descrizione', type: 'textarea', placeholder: 'Descrizione del modulo...' },
        { key: 'objective', label: 'Obiettivo pratico', type: 'textarea', placeholder: 'Cosa saprà fare l\'utente al termine...' },
        {
          key: 'softwareId',
          label: 'Software',
          type: 'select',
          required: true,
          loadOptions: async () => {
            const list = await api.software.findAll()
            return list.map((s: any) => ({ value: s.id, label: s.name }))
          },
        },
        {
          key: 'level',
          label: 'Livello',
          type: 'select',
          options: [
            { value: 'Base', label: 'Base' },
            { value: 'Intermedio', label: 'Intermedio' },
            { value: 'Avanzato', label: 'Avanzato' },
          ],
        },
        {
          key: 'publishState',
          label: 'Stato pubblicazione',
          type: 'select',
          options: [
            { value: 'PUBLISHED', label: '✅ Pubblicato — visibile e fruibile se assegnato' },
            { value: 'VISIBLE_LOCKED', label: '🔒 Visibile bloccato — compare nel catalogo ma non è fruibile' },
            { value: 'HIDDEN', label: '⚫ Nascosto — non compare nel catalogo' },
          ],
        },
        {
          key: 'thumbnailUrl',
          label: 'Anteprima immagine (URL opzionale)',
          type: 'text',
          placeholder: 'https://example.com/immagine.jpg — lascia vuoto per usare il placeholder automatico',
        },
      ]}
    />
  )
}
