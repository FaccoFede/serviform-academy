'use client'
import AdminCrud from '@/components/features/AdminCrud'
import { api } from '@/lib/api'

export default function AdminEventsPage() {
  return (
    <AdminCrud
      title="Eventi"
      columns={[
        { key: 'title', label: 'Titolo' },
        { key: 'eventType', label: 'Tipo' },
        { key: 'date', label: 'Data', render: (v) => v ? new Date(v).toLocaleDateString('it-IT') : '-' },
        { key: 'location', label: 'Luogo' },
        { key: 'maxSeats', label: 'Posti' },
        { key: 'published', label: 'Pubblicato', render: (v) => v ? '✅' : '❌' },
      ]}
      fetchItems={api.events.findAll}
      onSave={(data) => api.events.create({ ...data, date: new Date(data.date).toISOString() })}
      onUpdate={(id, data) => api.events.update(id, { ...data, date: data.date ? new Date(data.date).toISOString() : undefined })}
      onDelete={(id) => api.events.remove(id)}
      formFields={[
        { key: 'title', label: 'Titolo', type: 'text', required: true },
        { key: 'description', label: 'Descrizione', type: 'textarea' },
        { key: 'eventType', label: 'Tipo', type: 'select', required: true, options: [{ value: 'WORKSHOP', label: 'Workshop' }, { value: 'WEBINAR', label: 'Webinar' }, { value: 'LIVE_SESSION', label: 'Sessione live' }] },
        { key: 'date', label: 'Data e ora (YYYY-MM-DDTHH:mm)', type: 'text', required: true, placeholder: '2026-04-15T09:00' },
        { key: 'location', label: 'Luogo', type: 'text', placeholder: 'Online (Zoom)' },
        { key: 'maxSeats', label: 'Posti massimi', type: 'number' },
        { key: 'registrationUrl', label: 'URL iscrizione', type: 'text' },
        { key: 'recordingUrl', label: 'URL registrazione (post-evento)', type: 'text' },
      ]}
    />
  )
}
