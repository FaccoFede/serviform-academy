'use client'
import AdminCrud from '@/components/features/AdminCrud'
import { api } from '@/lib/api'

/**
 * Admin Esercitazioni — elenca TUTTI gli esercizi dal backend
 * (GET /exercises), con le colonne contesto corso/unità.
 *
 * In precedenza la pagina cercava `courses.units.exercises`, ma
 * `courses.findAll` non include gli esercizi → la tabella era sempre vuota.
 * Ora usa l'endpoint dedicato che restituisce gli esercizi con il join
 * sul loro corso/unità.
 */
export default function AdminExercisesPage() {
  return (
    <AdminCrud
      title="Esercitazioni"
      columns={[
        { key: 'courseTitle', label: 'Corso' },
        { key: 'unitTitle', label: 'Unità' },
        { key: 'title', label: 'Titolo' },
        { key: 'description', label: 'Descrizione' },
        { key: 'htmlUrl', label: 'HTML 3D', render: (v: any) => (v ? '✓' : '—') },
        { key: 'evdUrl', label: 'File .evd', render: (v: any) => (v ? '✓' : '—') },
        { key: 'order', label: '#' },
      ]}
      fetchItems={() => api.exercises.findAll()}
      onSave={(data) => api.exercises.create(data)}
      onUpdate={(id, data) => api.exercises.update(id, data)}
      onDelete={(id) => api.exercises.remove(id)}
      formFields={[
        { key: 'title', label: 'Titolo esercizio', type: 'text', required: true, placeholder: 'Es. Astuccio con chiusura a incastro' },
        { key: 'description', label: 'Descrizione obiettivo', type: 'textarea' },
        {
          key: 'unitId',
          label: 'Lezione',
          type: 'select',
          required: true,
          loadOptions: async () => {
            const courses = await api.courses.findAll()
            const opts: { value: string; label: string }[] = []
            for (const c of courses as any[]) {
              const units = await api.units.findByCourse(c.id).catch(() => [])
              for (const u of units as any[]) {
                if (u.unitType === 'LESSON') {
                  opts.push({ value: u.id, label: `${c.title} → ${u.title}` })
                }
              }
            }
            return opts
          },
        },
        { key: 'htmlUrl', label: 'URL anteprima HTML (modello 3D)', type: 'text', placeholder: 'https://...' },
        { key: 'evdUrl', label: 'URL file .evd (download)', type: 'text', placeholder: 'https://...' },
        { key: 'order', label: 'Ordine visualizzazione', type: 'number' },
      ]}
    />
  )
}
