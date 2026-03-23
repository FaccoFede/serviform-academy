'use client'
import AdminCrud from '@/components/features/AdminCrud'
import { api } from '@/lib/api'

export default function AdminSoftwarePage() {
  return (
    <AdminCrud
      title="Software"
      columns={[
        { key: 'name', label: 'Nome' },
        { key: 'slug', label: 'Slug' },
        { key: 'color', label: 'Colore', render: (v) => v ? <span style={{display:'inline-flex',alignItems:'center',gap:6}}><span style={{width:12,height:12,borderRadius:4,background:v,display:'inline-block'}} />{v}</span> : '-' },
        { key: 'tagline', label: 'Tagline' },
      ]}
      fetchItems={api.software.findAll}
      onSave={(data) => api.software.create(data)}
      onUpdate={(id, data) => api.software.update(id, data)}
      formFields={[
        { key: 'name', label: 'Nome', type: 'text', required: true },
        { key: 'slug', label: 'Slug', type: 'text', required: true },
        { key: 'tagline', label: 'Tagline', type: 'text' },
        { key: 'color', label: 'Colore (hex)', type: 'text', placeholder: '#003875' },
        { key: 'lightColor', label: 'Colore light (hex)', type: 'text', placeholder: '#EEF3FA' },
      ]}
    />
  )
}
