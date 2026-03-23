'use client'
import AdminCrud from '@/components/features/AdminCrud'
import { api } from '@/lib/api'

export default function AdminExercisesPage() {
  return (
    <AdminCrud
      title="Esercitazioni"
      columns={[
        { key: 'title', label: 'Titolo' },
        { key: 'description', label: 'Descrizione' },
        { key: 'htmlUrl', label: 'HTML 3D', render: (v: any) => v ? 'Sì' : '—' },
        { key: 'evdUrl', label: 'File .evd', render: (v: any) => v ? 'Sì' : '—' },
        { key: 'order', label: '#' },
      ]}
      fetchItems={async () => {
        const courses = await api.courses.findAll()
        return courses.flatMap((c: any) =>
          (c.units || []).flatMap((u: any) =>
            (u.exercises || []).map((e: any) => ({ ...e, unitTitle: u.title, courseTitle: c.title }))
          )
        )
      }}
      onSave={(data) => api.exercises.create(data)}
      onUpdate={(id, data) => api.exercises.update(id, data)}
      onDelete={(id) => api.exercises.remove(id)}
      formFields={[
        { key: 'title', label: 'Titolo esercizio', type: 'text', required: true, placeholder: 'Es. Astuccio con chiusura a incastro' },
        { key: 'description', label: 'Descrizione obiettivo', type: 'textarea' },
        {
          key: 'unitId', label: 'Unità (esercitazione)', type: 'select', required: true,
          loadOptions: async () => {
            const courses = await api.courses.findAll()
            return courses.flatMap((c: any) =>
              (c.units || [])
                .filter((u: any) => u.unitType === 'EXERCISE')
                .map((u: any) => ({ value: u.id, label: c.title + ' → ' + u.title }))
            )
          },
        },
        { key: 'htmlUrl', label: 'URL anteprima HTML (modello 3D)', type: 'text', placeholder: 'https://...' },
        { key: 'evdUrl', label: 'URL file .evd (download)', type: 'text', placeholder: 'https://...' },
        { key: 'order', label: 'Ordine visualizzazione', type: 'number' },
      ]}
    />
  )
}
