'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api, API_BASE_URL } from '@/lib/api'
import AdminCrud from '@/components/features/AdminCrud'
import styles from '../AdminPage.module.css'

/**
 * Admin Unità — revisione completa:
 *
 *  • L'`order` è gestito dal backend (Overview = 0, progressivo per le altre);
 *    l'admin non lo inserisce più a mano.
 *  • La durata è composta da due numerici: ore + minuti (0–23 h, 0–59 min);
 *    il backend genera la stringa formattata "5h", "20min", "1h 30min".
 *  • Le guide Zendesk sono selezionate dal catalogo centrale
 *    (/admin/guides → /guide-catalog). Se il catalogo è vuoto si può
 *    aggiungere al volo incollando un URL.
 *  • Selettore video dal catalogo o URL esterno — resolve relative URLs
 *    via API_BASE_URL.
 */

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('sa_token')
}

function authHeaders() {
  const token = getToken()
  return token
    ? { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }
    : { 'Content-Type': 'application/json' }
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--border)',
  borderRadius: 7,
  fontSize: 13,
  color: 'var(--ink)',
  background: 'var(--white)',
  boxSizing: 'border-box',
}

// ─── Componente: Durata ore + minuti ─────────────────────────────────────────

function DurationEditor({
  hours,
  minutes,
  onChange,
}: {
  hours: number | ''
  minutes: number | ''
  onChange: (h: number | '', m: number | '') => void
}) {
  const preview = (() => {
    const h = Number(hours || 0)
    const m = Number(minutes || 0)
    if (!h && !m) return 'Non specificata'
    if (h && m) return `${h}h ${m}min`
    if (h) return `${h}h`
    return `${m}min`
  })()

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <input
            type="number"
            min={0}
            max={23}
            placeholder="0"
            value={hours}
            onChange={(e) =>
              onChange(e.target.value === '' ? '' : Math.max(0, Math.min(23, +e.target.value)), minutes)
            }
            style={inputStyle}
          />
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>ore</span>
        </div>
        <div style={{ flex: 1 }}>
          <input
            type="number"
            min={0}
            max={59}
            placeholder="0"
            value={minutes}
            onChange={(e) =>
              onChange(hours, e.target.value === '' ? '' : Math.max(0, Math.min(59, +e.target.value)))
            }
            style={inputStyle}
          />
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>minuti</span>
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
        Anteprima: <strong style={{ color: 'var(--ink)' }}>{preview}</strong>
      </div>
    </div>
  )
}

// ─── Componente: Selettore guide dal catalogo ───────────────────────────────

interface CatalogGuide {
  id: string
  title: string
  url: string
  zendeskId?: string | null
}

function GuidesFromCatalog({
  selected,
  onChange,
}: {
  selected: CatalogGuide[]
  onChange: (g: CatalogGuide[]) => void
}) {
  const [catalog, setCatalog] = useState<CatalogGuide[]>([])
  const [loading, setLoading] = useState(true)
  const [pick, setPick] = useState('')
  const [quickUrl, setQuickUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    setLoading(true)
    try {
      const data = await api.guideCatalog.findAll()
      setCatalog(data as any)
    } catch {
      setCatalog([])
    }
    setLoading(false)
  }
  useEffect(() => {
    reload()
  }, [])

  const add = (id: string) => {
    const g = catalog.find((c) => c.id === id)
    if (!g) return
    if (selected.some((s) => s.id === g.id)) return
    onChange([...selected, g])
    setPick('')
  }

  const remove = (id: string) => onChange(selected.filter((g) => g.id !== id))

  const quickAdd = async () => {
    if (!quickUrl.trim()) return
    setAdding(true)
    setError(null)
    try {
      const g = (await api.guideCatalog.create({ url: quickUrl.trim() })) as any
      setQuickUrl('')
      await reload()
      if (!selected.some((s) => s.id === g.id)) onChange([...selected, g])
    } catch (e: any) {
      setError(e?.message || 'Errore aggiunta guida')
    }
    setAdding(false)
  }

  return (
    <div>
      {/* Lista guide già attaccate */}
      {selected.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {selected.map((g) => (
            <div
              key={g.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 7,
                padding: '7px 10px',
                marginBottom: 6,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  🔗 {g.title}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.url}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(g.id)}
                style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12, fontWeight: 700, marginLeft: 10 }}
              >
                × Rimuovi
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selettore dal catalogo */}
      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>Caricamento catalogo guide…</p>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
          >
            <option value="">— Seleziona una guida dal catalogo —</option>
            {catalog
              .filter((c) => !selected.some((s) => s.id === c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
          </select>
          <button
            type="button"
            disabled={!pick}
            onClick={() => add(pick)}
            style={{
              padding: '7px 14px',
              background: pick ? 'var(--ink)' : 'var(--border)',
              color: pick ? '#fff' : 'var(--muted)',
              border: 'none',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 700,
              cursor: pick ? 'pointer' : 'not-allowed',
            }}
          >
            + Aggiungi
          </button>
        </div>
      )}

      {/* Quick-add al volo */}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Aggiungi nuova nel catalogo
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <input
            type="text"
            placeholder="https://support.serviform.com/hc/..."
            value={quickUrl}
            onChange={(e) => setQuickUrl(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            type="button"
            disabled={!quickUrl.trim() || adding}
            onClick={quickAdd}
            style={{
              padding: '7px 14px',
              background: quickUrl.trim() ? 'var(--red)' : 'var(--border)',
              color: quickUrl.trim() ? '#fff' : 'var(--muted)',
              border: 'none',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 700,
              cursor: quickUrl.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {adding ? '…' : 'Aggiungi al catalogo'}
          </button>
        </div>
        <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
          Il titolo viene recuperato automaticamente dalla pagina. Gestisci il catalogo completo in{' '}
          <Link href="/admin/guides" style={{ color: 'var(--red)' }}>Catalogo guide</Link>.
        </p>
        {error && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{error}</p>}
      </div>
    </div>
  )
}

// ─── Componente: Selettore video dal catalogo ───────────────────────────────

function VideoSelector({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [catalog, setCatalog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'catalog' | 'url'>('catalog')

  useEffect(() => {
    api.videoAssets
      .findPublic()
      .then((d) => setCatalog(Array.isArray(d) ? d : []))
      .catch(() => setCatalog([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {(['catalog', 'url'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              padding: '5px 14px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: mode === m ? 'var(--ink)' : 'var(--white)',
              color: mode === m ? '#fff' : 'var(--muted)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {m === 'catalog' ? '🎬 Dal catalogo' : '🔗 URL esterno'}
          </button>
        ))}
      </div>

      {mode === 'catalog' ? (
        loading ? (
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Caricamento catalogo video…</p>
        ) : catalog.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            Nessun video nel catalogo.{' '}
            <Link href="/admin/videos" style={{ color: 'var(--red)' }}>
              Gestisci catalogo →
            </Link>
          </p>
        ) : (
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">— Nessun video —</option>
            {catalog.map((v: any) => (
              <option key={v.id} value={v.url}>
                {v.title}
                {v.mimeType === 'external/link' ? ' (URL esterno)' : ''}
              </option>
            ))}
          </select>
        )
      ) : (
        <input
          style={inputStyle}
          type="text"
          placeholder="https://... (YouTube, Vimeo, MP4 remoto...)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {value && (
        <div style={{ marginTop: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            ✓ {value.length > 60 ? value.slice(0, 60) + '…' : value}
          </span>
          <button
            type="button"
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

// ─── Pagina principale ──────────────────────────────────────────────────────

export default function AdminUnitsPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [loadingCourses, setLoadingCourses] = useState(true)

  // Stato del form corrente (custom fields)
  const [editVideoUrl, setEditVideoUrl] = useState('')
  const [editGuides, setEditGuides] = useState<CatalogGuide[]>([])
  const [editHours, setEditHours] = useState<number | ''>('')
  const [editMinutes, setEditMinutes] = useState<number | ''>('')

  useEffect(() => {
    api.courses.findAll().then((list) => {
      setCourses(list)
      setLoadingCourses(false)
    })
  }, [])

  const resetForm = () => {
    setEditVideoUrl('')
    setEditGuides([])
    setEditHours('')
    setEditMinutes('')
  }

  const saveGuidesForUnit = async (unitId: string) => {
    // Elimina tutte le guide esistenti e ricrea dal catalogo selezionato
    await fetch(API_BASE_URL + '/guides/unit/' + unitId + '/all', {
      method: 'DELETE',
      headers: authHeaders() as any,
    })
    for (let i = 0; i < editGuides.length; i++) {
      const g = editGuides[i]
      await fetch(API_BASE_URL + '/guides', {
        method: 'POST',
        headers: authHeaders() as any,
        body: JSON.stringify({
          unitId,
          catalogId: g.id,
          zendeskId: g.zendeskId || '',
          title: g.title,
          url: g.url,
          order: i,
        }),
      })
    }
  }

  if (loadingCourses) return <main className={styles.main}><p>Caricamento…</p></main>

  return (
    <main className={styles.main}>
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/admin"
          style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textDecoration: 'none' }}
        >
          ← Admin
        </Link>
        <h1 className={styles.title}>Unità didattiche</h1>
        <p className={styles.desc}>
          Seleziona il corso, gestisci le unità. L'ordine è automatico
          (Overview = 0, lezioni 1, 2, 3…).
        </p>
      </div>

      {/* Selezione corso */}
      <div style={{ marginBottom: 28 }}>
        <label
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '.5px',
            display: 'block',
            marginBottom: 8,
          }}
        >
          Corso
        </label>
        <select
          value={selectedCourse?.id || ''}
          onChange={(e) => setSelectedCourse(courses.find((c) => c.id === e.target.value) || null)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            fontSize: 14,
            background: 'var(--white)',
            color: 'var(--ink)',
            minWidth: 320,
          }}
        >
          <option value="">— Seleziona un corso —</option>
          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.software?.name || '?'})
            </option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <AdminCrud
          title={`Unità — ${selectedCourse.title}`}
          columns={[
            {
              key: 'order',
              label: '#',
              render: (v: any) => (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</span>
              ),
            },
            { key: 'title', label: 'Titolo' },
            { key: 'unitType', label: 'Tipo' },
            { key: 'duration', label: 'Durata' },
            {
              key: 'videoUrl',
              label: 'Video',
              render: (v: any) =>
                v ? (
                  <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    ▶ presente
                  </span>
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                ),
            },
            {
              key: 'guides',
              label: 'Guide',
              render: (v: any) => {
                const count = Array.isArray(v) ? v.length : 0
                return count > 0 ? (
                  <span style={{ color: '#067DB8', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    🔗 {count}
                  </span>
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                )
              },
            },
          ]}
          fetchItems={async () => {
            const units = await api.units.findByCourse(selectedCourse.id)
            for (const u of units as any[]) {
              try {
                const res = await fetch(API_BASE_URL + '/guides/unit/' + u.id, { headers: authHeaders() as any })
                u.guides = res.ok ? await res.json() : []
              } catch {
                u.guides = []
              }
            }
            return units
          }}
          onSave={async (data) => {
            // Rimuovi i campi custom dal payload principale
            const { videoUrl: _v, guides: _g, duration: _d, order: _o, ...rest } = data
            const unit: any = await api.units.create({
              ...rest,
              courseId: selectedCourse.id,
              videoUrl: editVideoUrl || null,
              durationHours: editHours === '' ? null : Number(editHours),
              durationMinutes: editMinutes === '' ? null : Number(editMinutes),
            })
            await saveGuidesForUnit(unit.id)
            resetForm()
            return unit
          }}
          onUpdate={async (id, data) => {
            const { videoUrl: _v, guides: _g, duration: _d, order: _o, ...rest } = data
            const unit: any = await api.units.update(id, {
              ...rest,
              videoUrl: editVideoUrl || null,
              durationHours: editHours === '' ? null : Number(editHours),
              durationMinutes: editMinutes === '' ? null : Number(editMinutes),
            })
            await saveGuidesForUnit(id)
            resetForm()
            return unit
          }}
          onDelete={(id) => api.units.remove(id)}
          onEdit={async (item: any) => {
            setEditVideoUrl(item.videoUrl || '')
            setEditHours(item.durationHours ?? '')
            setEditMinutes(item.durationMinutes ?? '')
            const guides = Array.isArray(item.guides) ? item.guides : []
            setEditGuides(
              guides.map((g: any) => ({
                id: g.catalogId || g.id,
                title: g.title || '',
                url: g.url || '',
                zendeskId: g.zendeskId || null,
              })),
            )
          }}
          formFields={[
            { key: 'title', label: 'Titolo', type: 'text', required: true, placeholder: 'Es. Introduzione al modulo' },
            {
              key: 'unitType',
              label: 'Tipo unità',
              type: 'select',
              options: [
                { value: 'LESSON', label: 'Lezione' },
                { value: 'EXERCISE', label: 'Esercitazione' },
                { value: 'OVERVIEW', label: 'Overview (una sola per corso, ordine 0)' },
              ],
            },
            { key: 'subtitle', label: 'Sottotitolo', type: 'text', placeholder: 'Breve descrizione' },
            {
              key: 'durationCustom',
              label: 'Durata',
              type: 'custom',
              customRender: () => (
                <DurationEditor
                  hours={editHours}
                  minutes={editMinutes}
                  onChange={(h, m) => {
                    setEditHours(h)
                    setEditMinutes(m)
                  }}
                />
              ),
            },
            {
              key: 'videoUrl',
              label: 'Video',
              type: 'custom',
              customRender: () => <VideoSelector value={editVideoUrl} onChange={setEditVideoUrl} />,
            },
            {
              key: 'content',
              label: 'Contenuto HTML',
              type: 'richtext',
              placeholder: '<h3>Titolo sezione</h3>\n<p>Contenuto della lezione...</p>',
            },
            {
              key: 'guides',
              label: 'Guide dal catalogo',
              type: 'custom',
              customRender: () => <GuidesFromCatalog selected={editGuides} onChange={setEditGuides} />,
            },
          ]}
        />
      )}
    </main>
  )
}
