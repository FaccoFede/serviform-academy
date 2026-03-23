'use client'
import AdminCrud from '@/components/features/AdminCrud'
import { api } from '@/lib/api'

export default function AdminPricingPage() {
  return (
    <AdminCrud
      title="Listino Prezzi"
      columns={[
        { key: 'name', label: 'Nome' },
        { key: 'price', label: 'Prezzo' },
        { key: 'priceNote', label: 'Nota' },
        { key: 'highlighted', label: 'In evidenza', render: (v) => v ? '⭐' : '' },
        { key: 'order', label: 'Ordine' },
      ]}
      fetchItems={api.pricing.findAll}
      onSave={(data) => api.pricing.create({ ...data, features: data.features ? data.features.split('\n').filter(Boolean) : [] })}
      onUpdate={(id, data) => api.pricing.update(id, { ...data, features: typeof data.features === 'string' ? data.features.split('\n').filter(Boolean) : data.features })}
      onDelete={(id) => api.pricing.remove(id)}
      formFields={[
        { key: 'name', label: 'Nome pacchetto', type: 'text', required: true },
        { key: 'slug', label: 'Slug', type: 'text', required: true },
        { key: 'description', label: 'Descrizione', type: 'textarea' },
        { key: 'price', label: 'Prezzo', type: 'text', placeholder: 'Es. € 149' },
        { key: 'priceNote', label: 'Nota prezzo', type: 'text', placeholder: 'Es. per modulo' },
        { key: 'features', label: 'Feature (una per riga)', type: 'textarea', placeholder: 'Feature 1\nFeature 2\nFeature 3' },
        { key: 'highlighted', label: 'In evidenza', type: 'select', options: [{ value: 'false', label: 'No' }, { value: 'true', label: 'Sì' }] },
        { key: 'order', label: 'Ordine', type: 'number' },
      ]}
    />
  )
}
