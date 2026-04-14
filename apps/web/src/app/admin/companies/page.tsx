'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { getBrand } from '@/lib/brands'
import styles from '../AdminPage.module.css'
import t from '../table.module.css'

/**
 * Admin Aziende — include ora il pannello "Preferenze contenuti":
 * l'admin seleziona quali Software (EngView, Sysform, ProjectO, ServiformA…)
 * sono visibili nel portale per i membri dell'azienda.
 *
 * Regole:
 *  • Nessun Software selezionato = nessun filtro → l'azienda vede tutti i corsi.
 *  • La selezione filtra SOLO il catalogo corsi (/courses/portal).
 *  • Comunicazioni (announcements) ed Eventi restano sempre visibili a tutti.
 */
export default function AdminCompaniesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [show, setShow] = useState(false)
  const [edit, setEdit] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null)

  const load = async () => { setLoading(true); try { setRows(await api.companies.findAll()) } catch {} finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const openNew = () => { setEdit(null); setForm({}); setMsg(null); setShow(true) }
  const openEdit = (r: any) => { setEdit(r); setForm({...r, assistanceExpiresAt: r.assistanceExpiresAt?.slice(0,10)||''}); setMsg(null); setShow(true) }

  const save = async () => {
    setSaving(true)
    try {
      if (edit) await api.companies.update(edit.id, form); else await api.companies.create(form)
      setMsg({t: edit ? 'Aggiornata.' : 'Creata.', ok: true}); setShow(false); load()
    } catch(e:any) { setMsg({t:e.message,ok:false}) } finally { setSaving(false) }
  }

  const del = async (id: string, name: string) => {
    if (!confirm(`Eliminare "${name}"?`)) return
    await api.companies.remove(id)
    load()
  }

  const toggleSoftware = (id: string) => {
    const current: string[] = form.visibleSoftwareIds || []
    if (current.includes(id)) {
      setForm({ ...form, visibleSoftwareIds: current.filter((x) => x !== id) })
    } else {
      setForm({ ...form, visibleSoftwareIds: [...current, id] })
    }
  }

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <main className={styles.main}>
      <div className={t.hdr}>
        <div>
          <Link href="/admin" className={t.back}>← Admin</Link>
          <h1 className={styles.title}>Aziende</h1>
          <p className={styles.desc}>{rows.length} aziende · filtri portale per software</p>
        </div>
        <button className={t.btnP} onClick={openNew}>+ Nuova azienda</button>
      </div>

      {msg && (
        <div className={msg.ok ? t.ok : t.err}>
          {msg.t}
          <button onClick={() => setMsg(null)}>×</button>
        </div>
      )}

      <input
        className={t.search}
        placeholder="Cerca azienda…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loading ? (
        <p>Caricamento…</p>
      ) : (
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead>
              <tr>
                <th>Azienda</th>
                <th>Contratto</th>
                <th>Scadenza assist.</th>
                <th>Utenti</th>
                <th>Corsi</th>
                <th>Portale</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const visible: string[] = Array.isArray(r.visibleSoftwareIds) ? r.visibleSoftwareIds : []
                return (
                  <tr key={r.id}>
                    <td className={t.tdBold}>{r.name}</td>
                    <td>{r.contractType || '—'}</td>
                    <td>
                      {r.assistanceExpiresAt
                        ? new Date(r.assistanceExpiresAt).toLocaleDateString('it-IT')
                        : '∞'}
                    </td>
                    <td>{r._count?.members ?? '—'}</td>
                    <td>{r._count?.courseAssignments ?? '—'}</td>
                    <td>
                      {visible.length === 0 ? (
                        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                          TUTTI
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: '#067DB8',
                          }}
                        >
                          {visible.length} software
                        </span>
                      )}
                    </td>
                    <td className={t.actions}>
                      <button className={t.btnE} onClick={() => openEdit(r)}>Modifica</button>
                      <button className={t.btnD} onClick={() => del(r.id, r.name)}>Elimina</button>
                    </td>
                  </tr>
                )
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={7} className={t.empty}>Nessuna azienda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {show && (
        <div className={t.overlay}>
          <div className={t.modal} style={{ maxWidth: 620 }}>
            <div className={t.mhdr}>
              <h2>{edit ? 'Modifica' : 'Nuova'} azienda</h2>
              <button onClick={() => setShow(false)}>×</button>
            </div>
            <div className={t.mbody}>
              {msg && <div className={msg.ok ? t.ok : t.err}>{msg.t}</div>}
              <label className={t.lbl}>Ragione sociale *</label>
              <input
                className={t.inp}
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Es. Rossi S.r.l."
              />
              <label className={t.lbl}>Slug * (es. rossi-srl)</label>
              <input
                className={t.inp}
                value={form.slug || ''}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                disabled={!!edit}
                placeholder="rossi-srl"
              />
              <label className={t.lbl}>Tipo contratto</label>
              <select
                className={t.inp}
                value={form.contractType || ''}
                onChange={(e) => setForm({ ...form, contractType: e.target.value })}
              >
                <option value="">—</option>
                {['Standard', 'Enterprise', 'Trial', 'Personalizzato'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <label className={t.lbl}>Scadenza assistenza</label>
              <input
                className={t.inp}
                type="date"
                value={form.assistanceExpiresAt || ''}
                onChange={(e) => setForm({ ...form, assistanceExpiresAt: e.target.value || null })}
              />
              <label className={t.lbl}>Note</label>
              <textarea className={t.ta} rows={2} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
