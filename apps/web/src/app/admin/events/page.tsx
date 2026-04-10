'use client'
import AdminCrud from '@/components/features/AdminCrud'
import { api } from '@/lib/api'

/**
 * Admin Events — usa /events/admin/all per vedere anche eventi non pubblicati.
 * FIX: data inviata come stringa ISO — il backend ora la converte correttamente.
 */
export default function AdminEventsPage() {
  return (
    <AdminCrud
      title="Eventi"
      columns={[
        { key: 'title', label: 'Titolo' },
        { key: 'eventType', label: 'Tipo' },
        {
          key: 'date',
          label: 'Data',
          render: (v: any) => v ? new Date(v).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-',
        },
        { key: 'location', label: 'Luogo' },
        { key: 'maxSeats', label: 'Posti' },
        { key: 'published', label: 'Pubblicato', render: (v: any) => v ? '✅' : '❌' },
      ]}
      fetchItems={api.events.findAllAdmin}
      onSave={(data) => api.events.create({
        ...data,
        published: data.published === 'true',
      })}
      onUpdate={(id, data) => api.events.update(id, {
        ...data,
        published: data.published === 'true',
      })}
      onDelete={(id) => api.events.remove(id)}
      formFields={[
        { key: 'title', label: 'Titolo', type: 'text', required: true },
        { key: 'description', label: 'Descrizione', type: 'textarea' },
        {
          key: 'eventType',
          label: 'Tipo',
          type: 'select',
          required: true,
          options: [
            { value: 'WORKSHOP', label: 'Workshop' },
            { value: 'WEBINAR', label: 'Webinar' },
            { value: 'LIVE_SESSION', label: 'Sessione live' },
          ],
        },
        {
          key: 'date',
          label: 'Data e ora (es. 2026-04-15T09:00)',
          type: 'text',
          required: true,
          placeholder: '2026-04-15T09:00',
        },
        {
          key: 'endDate',
          label: 'Data fine (opzionale)',
          type: 'text',
          placeholder: '2026-04-15T11:00',
        },
        { key: 'location', label: 'Luogo', type: 'text', placeholder: 'Online (Zoom)' },
        { key: 'maxSeats', label: 'Posti massimi', type: 'number' },
        { key: 'registrationUrl', label: 'URL iscrizione', type: 'text' },
        { key: 'recordingUrl', label: 'URL registrazione (post-evento)', type: 'text' },
        {
          key: 'published',
          label: 'Visibile sul calendario',
          type: 'select',
          options: [
            { value: 'false', label: 'No (bozza)' },
            { value: 'true',  label: 'Sì (pubblica)' },
          ],
        },
      ]}
    />
  )
}
