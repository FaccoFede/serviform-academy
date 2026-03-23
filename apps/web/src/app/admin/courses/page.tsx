'use client'
import AdminCrud from '@/components/features/AdminCrud'
import { api } from '@/lib/api'

/**
 * Admin Corsi — gestione completa dei moduli di formazione.
 *
 * Il campo "Software" usa loadOptions per caricare dinamicamente
 * la lista dei software dal backend (dropdown con nomi, non UUID).
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
        { key: 'available', label: 'Attivo', render: (v: any) => v ? 'Sì' : 'No' },
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
        {
          key: 'softwareId', label: 'Software', type: 'select', required: true,
          loadOptions: async () => {
            const list = await api.software.findAll()
            return list.map((s: any) => ({ value: s.id, label: s.name }))
          },
        },
        { key: 'level', label: 'Livello', type: 'select', options: [
          { value: 'Base', label: 'Base' },
          { value: 'Intermedio', label: 'Intermedio' },
          { value: 'Avanzato', label: 'Avanzato' },
        ]},
        { key: 'duration', label: 'Durata stimata', type: 'text', placeholder: 'Es. 3h 30m' },
        { key: 'available', label: 'Disponibile', type: 'select', options: [
          { value: 'true', label: 'Sì — visibile agli utenti' },
          { value: 'false', label: 'No — nascosto (in lavorazione)' },
        ]},
      ]}
    />
  )
}
