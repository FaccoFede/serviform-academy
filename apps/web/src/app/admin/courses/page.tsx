'use client'

import AdminCrud from '@/components/features/AdminCrud'
import { api } from '@/lib/api'

/**
 * Admin Corsi — gestione con publishState al posto del solo boolean available.
 * publishState: HIDDEN | VISIBLE_LOCKED | PUBLISHED
 */
export default function AdminCoursesPage() {
  return (
    <AdminCrud
      title="Moduli / Corsi"
      columns={[
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
        { key: 'duration', label: 'Durata stimata', type: 'text', placeholder: 'Es. 3h 30m' },
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
      ]}
    />
  )
}
