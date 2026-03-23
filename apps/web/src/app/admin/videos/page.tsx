'use client'
import AdminCrud from '@/components/features/AdminCrud'
import { api } from '@/lib/api'

export default function AdminVideosPage() {
  return (
    <AdminCrud
      title="Video Pillole"
      columns={[
        { key: 'title', label: 'Titolo' },
        { key: 'youtubeId', label: 'YouTube ID' },
        { key: 'software', label: 'Software', render: (_: any, row: any) => row.software?.name || '—' },
      ]}
      fetchItems={api.videos.findAll}
      onSave={(data) => api.videos.create(data)}
      onUpdate={(id, data) => api.videos.update(id, data)}
      onDelete={(id) => api.videos.remove(id)}
      formFields={[
        { key: 'title', label: 'Titolo video', type: 'text', required: true },
        { key: 'youtubeId', label: 'YouTube Video ID', type: 'text', required: true, placeholder: 'Es. zt4aT5oKLII' },
        {
          key: 'softwareId', label: 'Software', type: 'select', required: true,
          loadOptions: async () => {
            const list = await api.software.findAll()
            return list.map((s: any) => ({ value: s.id, label: s.name }))
          },
        },
        { key: 'description', label: 'Descrizione', type: 'textarea', placeholder: 'Breve descrizione del contenuto...' },
      ]}
    />
  )
}
