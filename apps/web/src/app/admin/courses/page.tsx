'use client'

import Link from 'next/link'
import AdminCrud from '@/components/features/AdminCrud'
import { api } from '@/lib/api'

/**
 * Admin Corsi — gestione con publishState e thumbnailUrl configurabile.
 * publishState: HIDDEN | VISIBLE_LOCKED | PUBLISHED
 * thumbnailUrl: opzionale, se vuoto usa placeholder automatico dal brand software
 * duration: calcolata automaticamente dalla somma delle durate delle unità del corso
 */

const publishStateLabel: Record<string, string> = {
  HIDDEN: '⚫ Nascosto',
  VISIBLE_LOCKED: '🔒 Bloccato',
  PUBLISHED: '✅ Pubblicato',
}

const publishStateBadge: Record<string, React.CSSProperties> = {
  HIDDEN: { background: '#F3F3F3', color: 'var(--muted)', border: '1px solid var(--border)' },
  VISIBLE_LOCKED: { background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' },
  PUBLISHED: { background: '#ECFDF5', color: '#065F46', border: '1px solid #6EE7B7' },
}

export default function AdminCoursesPage() {
  return (
    <AdminCrud
      title="Moduli / Corsi"
      columns={[
        {
          key: 'thumbnailUrl',
          label: '',
          render: (v: any) => v
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
          render: (v: any) => (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              ...(publishStateBadge[v as string] || { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }),
            }}>
              {publishStateLabel[v as string] || v}
            </span>
          ),
        },
        { key: 'software', label: 'Software', render: (_: any, row: any) => row.software?.name || '—' },
      ]}
      fetchItems={api.courses.findAll}
      onSave={(data) => api.courses.create(data)}
      onUpdate={(id, data) => api.courses.update(id, data)}
      onDelete={(id) => api.courses.remove(id)}
      extraActions={(course) => (
        <Link
          href={`/admin/units?courseId=${course.id}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 10px',
            border: '1px solid var(--border)',
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--po)',
            background: 'var(--white)',
            textDecoration: 'none',
            transition: 'all var(--t-color)',
            fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--po-light)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--po)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--white)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
        >
          Unità →
        </Link>
      )}
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
