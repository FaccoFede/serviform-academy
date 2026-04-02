'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import AdminCrud from '@/components/features/AdminCrud'
import styles from '../AdminPage.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('sa_token')
}

function authHeaders() {
  const token = getToken()
  return token ? { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token } : { 'Content-Type': 'application/json' }
}

// ── Componente per gestire N guide Zendesk ──────────────────────────────────
function GuidesEditor({ guides, onChange }: {
  guides: { zendeskId: string; title: string; url: string }[]
  onChange: (guides: { zendeskId: string; title: string; url: string }[]) => void
}) {
  const add = () => onChange([...guides, { zendeskId: '', title: '', url: '' }])
  const remove = (i: number) => onChange(guides.filter((_, idx) => idx !== i))
  const update = (i: number, field: string, value: string) => {
    const updated = [...guides]
    updated[i] = { ...updated[i], [field]: value }
    onChange(updated)
  }

  return (
    <div style={{ marginTop: 4 }}>
      {guides.map((g, i) => (
        <div key={i} style={{ background: 'var(--surface)', borderRadius: 8, padding: '12px 14px', marginBottom: 10, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              Guida {i + 1}
            </span>
            <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              × Rimuovi
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              style={inputStyle}
              placeholder="ID articolo Zendesk (es. 360001234567)"
              value={g.zendeskId}
              onChange={e => update(i, 'zendeskId', e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="Titolo guida"
              value={g.title}
              onChange={e => update(i, 'title', e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="URL (https://support.serviform.com/...)"
              value={g.url}
              onChange={e => update(i, 'url', e.target.value)}
            />
          </div>
        </div>
      ))}
      <button onClick={add} style={{ width: '100%', padding: '8px', border: '1.5px dashed var(--border)', borderRadius: 8, background: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
        + Aggiungi guida Zendesk
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid var(--border)',
  borderRadius: 7, fontSize: 13, color: 'var(--ink)', background: 'var(--white)',
  boxSizing: 'border-box',
}

// ── Componente selettore video dal catalogo ─────────────────────────────────
function VideoSelector({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [catalog, setCatalog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'catalog' | 'url'>('catalog')

  useEffect(() => {
    fetch(API_URL + '/video-assets/public', { headers: authHeaders() as any })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCatalog(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {(['catalog', 'url'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)',
              background: mode === m ? 'var(--ink)' : 'var(--white)',
              color: mode === m ? '#fff' : 'var(--muted)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {m === 'catalog' ? '🎬 Dal catalogo' : '🔗 URL esterno'}
          </button>
        ))}
      </div>

      {mode === 'catalog' ? (
        loading ? (
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Caricamento catalogo...</p>
        ) : catalog.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            Nessun video nel catalogo.{' '}
            <Link href="/admin/videos" style={{ color: 'var(--red)' }}>Carica video →</Link>
          </p>
        ) : (
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={value}
            onChange={e => onChange(e.target.value)}
          >
            <option value="">— Nessun video —</option>
            {catalog.map((v: any) => (
              <option key={v.id} value={v.url}>
                {v.title} ({v.filename})
              </option>
            ))}
          </select>
        )
      ) : (
        <input
          style={inputStyle}
          type="text"
          placeholder="https://... (YouTube, Vimeo, URL diretto MP4...)"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}

      {value && (
        <div style={{ marginTop: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            ✓ {value.length > 60 ? value.slice(0, 60) + '…' : value}
          </span>
          <button
            onClick={() => onChange('')}
            style={{ marginLeft: 8, fontSize: 11, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            × Rimuovi
          </button>
        </div>
      )}
    </div>
  )
}

// ── Pagina principale ────────────────────────────────────────────────────────
export default function AdminUnitsPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [loadingCourses, setLoadingCourses] = useState(true)
  // Stato per il form unità esteso (video + guide)
  const [editGuides, setEditGuides] = useState<{ zendeskId: string; title: string; url: string }[]>([])
  const [editVideoUrl, setEditVideoUrl] = useState('')
  const [editUnitId, setEditUnitId] = useState<string | null>(null)

  useEffect(() => {
    api.courses.findAll().then(list => {
      setCourses(list)
      setLoadingCourses(false)
    })
  }, [])

  // Salva le guide quando si salva l'unità
  const saveGuides = async (unitId: string) => {
    const validGuides = editGuides.filter(g => g.title.trim() && g.url.trim())
    if (!validGuides.length && editUnitId === unitId) return // nessuna guida da salvare
    await fetch(API_URL + '/guides/unit/' + unitId + '/all', {
      method: 'DELETE',
      headers: authHeaders() as any,
    })
    for (let i = 0; i < validGuides.length; i++) {
      await fetch(API_URL + '/guides', {
        method: 'POST',
        headers: authHeaders() as any,
        body: JSON.stringify({ ...validGuides[i], unitId, order: i }),
      })
    }
  }

  if (loadingCourses) return <main className={styles.main}><p>Caricamento...</p></main>

  return (
    <main className={styles.main}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin" style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textDecoration: 'none' }}>← Admin</Link>
        <h1 className={styles.title}>Unità didattiche</h1>
        <p className={styles.desc}>Gestisci le unità per corso. Seleziona prima il corso.</p>
      </div>

      {/* Selezione corso */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 8 }}>
          Corso
        </label>
        <select
          value={selectedCourse?.id || ''}
          onChange={e => setSelectedCourse(courses.find(c => c.id === e.target.value) || null)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, background: 'var(--white)', color: 'var(--ink)', minWidth: 320 }}
        >
          <option value="">— Seleziona un corso —</option>
          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>{c.title} ({c.software?.name || '?'})</option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <AdminCrud
          title={`Unità — ${selectedCourse.title}`}
          columns={[
            { key: 'order', label: '#', render: (v: any) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</span> },
            { key: 'title', label: 'Titolo' },
            { key: 'unitType', label: 'Tipo' },
            { key: 'duration', label: 'Durata' },
            {
              key: 'videoUrl',
              label: 'Video',
              render: (v: any) => v
                ? <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>▶ presente</span>
                : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>,
            },
            {
              key: 'guides',
              label: 'Guide Zendesk',
              render: (v: any) => {
                const count = Array.isArray(v) ? v.length : 0
                return count > 0
                  ? <span style={{ color: '#067DB8', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>🔗 {count} {count === 1 ? 'guida' : 'guide'}</span>
                  : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
              },
            },
          ]}
          fetchItems={async () => {
            const units = await api.units.findByCourse(selectedCourse.id)
            // Carica le guide per ogni unità
            for (const u of units as any[]) {
              try {
                const res = await fetch(API_URL + '/guides/unit/' + u.id, { headers: authHeaders() as any })
                u.guides = res.ok ? await res.json() : []
              } catch { u.guides = [] }
            }
            return units
          }}
          onSave={async (data) => {
            const { videoUrl: vUrl, guides: _g, ...unitData } = data
            const unit = await api.units.create({
              ...unitData,
              courseId: selectedCourse.id,
              order: parseInt(unitData.order) || 1,
              videoUrl: editVideoUrl || null,
            })
            await saveGuides(unit.id)
            // Reset
            setEditGuides([])
            setEditVideoUrl('')
            setEditUnitId(null)
            return unit
          }}
          onUpdate={async (id, data) => {
            const { videoUrl: _v, guides: _g, ...unitData } = data
            const unit = await api.units.update(id, {
              ...unitData,
              order: unitData.order ? parseInt(unitData.order) : undefined,
              videoUrl: editVideoUrl || null,
            })
            await saveGuides(id)
            setEditGuides([])
            setEditVideoUrl('')
            setEditUnitId(null)
            return unit
          }}
          onDelete={(id) => api.units.remove(id)}
          onEdit={async (item: any) => {
            // Precarica guide e video per l'editing
            setEditUnitId(item.id)
            setEditVideoUrl(item.videoUrl || '')
            const guides = Array.isArray(item.guides) ? item.guides : []
            setEditGuides(guides.map((g: any) => ({
              zendeskId: g.zendeskId || '',
              title: g.title || '',
              url: g.url || '',
            })))
          }}
          formFields={[
            { key: 'title', label: 'Titolo', type: 'text', required: true, placeholder: 'Es. Introduzione al modulo' },
            { key: 'order', label: 'Ordine', type: 'number', placeholder: '1' },
            {
              key: 'unitType', label: 'Tipo', type: 'select',
              options: [
                { value: 'OVERVIEW', label: 'Overview (introduttiva)' },
                { value: 'LESSON', label: 'Lezione' },
                { value: 'EXERCISE', label: 'Esercitazione' },
              ],
            },
            { key: 'subtitle', label: 'Sottotitolo', type: 'text', placeholder: 'Breve descrizione' },
            { key: 'duration', label: 'Durata', type: 'text', placeholder: 'Es. 15min' },
            {
              key: 'videoUrl',
              label: 'Video',
              type: 'custom',
              customRender: () => (
                <VideoSelector value={editVideoUrl} onChange={setEditVideoUrl} />
              ),
            },
            {
              key: 'content',
              label: 'Contenuto HTML',
              type: 'richtext',
              placeholder: '<h3>Titolo sezione</h3>\n<p>Contenuto della lezione...</p>',
            },
            {
              key: 'guides',
              label: 'Guide Zendesk',
              type: 'custom',
              customRender: () => (
                <GuidesEditor guides={editGuides} onChange={setEditGuides} />
              ),
            },
          ]}
        />
      )}
    </main>
  )
}
