'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../AdminPage.module.css'
import tableStyles from './CompaniesAdmin.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function authHeaders() {
  const token = localStorage.getItem('sa_token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(API_URL + '/companies', { headers: authHeaders() })
      if (res.ok) setCompanies(await res.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() { setEditItem(null); setForm({}); setShowForm(true); setMsg(null) }
  function openEdit(item: any) { setEditItem(item); setForm({ ...item, assistanceExpiresAt: item.assistanceExpiresAt ? item.assistanceExpiresAt.slice(0, 10) : '' }); setShowForm(true); setMsg(null) }

  async function handleSave() {
    setSaving(true)
    try {
      const url = editItem ? API_URL + '/companies/' + editItem.id : API_URL + '/companies'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).message || 'Errore')
      setMsg({ text: editItem ? 'Azienda aggiornata.' : 'Azienda creata.', type: 'success' })
      setShowForm(false)
      load()
    } catch (e: any) {
      setMsg({ text: e.message, type: 'error' })
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Eliminare "${name}"? L'operazione è irreversibile.`)) return
    try {
      await fetch(API_URL + '/companies/' + id, { method: 'DELETE', headers: authHeaders() })
      load()
    } catch { /* ignore */ }
  }

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className={styles.main}>
      <div className={tableStyles.pageHeader}>
        <div>
          <Link href="/admin" className={tableStyles.back}>← Admin</Link>
          <h1 className={styles.title}>Aziende</h1>
          <p className={styles.desc}>{companies.length} aziende registrate</p>
        </div>
        <button className={tableStyles.btnPrimary} onClick={openCreate}>+ Nuova azienda</button>
      </div>

      {msg && (
        <div className={`${tableStyles.msg} ${msg.type === 'error' ? tableStyles.msgError : tableStyles.msgSuccess}`}>
          {msg.text}
          <button onClick={() => setMsg(null)}>×</button>
        </div>
      )}

      <div className={tableStyles.toolbar}>
        <input className={tableStyles.search} placeholder="Cerca azienda..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className={tableStyles.loading}>Caricamento...</p>
      ) : (
        <div className={tableStyles.tableWrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Azienda</th>
                <th>Contratto</th>
                <th>Scadenza assistenza</th>
                <th>Software</th>
                <th>Utenti</th>
                <th>Corsi</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className={tableStyles.tdName}>{c.name}</td>
                  <td>{c.contractType || '—'}</td>
                  <td>
                    {c.assistanceExpiresAt
                      ? new Date(c.assistanceExpiresAt).toLocaleDateString('it-IT')
                      : <span className={tableStyles.infinity}>∞</span>}
                  </td>
                  <td>
                    <div className={tableStyles.tags}>
                      {(c.interests || []).map((i: any) => (
                        <span key={i.id} className={tableStyles.tag}>{i.software?.name}</span>
                      ))}
                      {!c.interests?.length && <span className={tableStyles.none}>—</span>}
                    </div>
                  </td>
                  <td>{c._count?.members ?? '—'}</td>
                  <td>{c._count?.courseAssignments ?? '—'}</td>
                  <td className={tableStyles.actions}>
                    <button className={tableStyles.btnEdit} onClick={() => openEdit(c)}>Modifica</button>
                    <button className={tableStyles.btnDelete} onClick={() => handleDelete(c.id, c.name)}>Elimina</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className={tableStyles.empty}>Nessuna azienda trovata.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modale */}
      {showForm && (
        <div className={tableStyles.overlay}>
          <div className={tableStyles.modal}>
            <div className={tableStyles.modalHeader}>
              <h2>{editItem ? 'Modifica azienda' : 'Nuova azienda'}</h2>
              <button className={tableStyles.modalClose} onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className={tableStyles.modalBody}>
              {msg && (
                <div className={`${tableStyles.msg} ${msg.type === 'error' ? tableStyles.msgError : tableStyles.msgSuccess}`}>
                  {msg.text}
                </div>
              )}
              <label className={tableStyles.label}>Ragione sociale *</label>
              <input className={tableStyles.input} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Es. Rossi S.r.l." />

              <label className={tableStyles.label}>Slug (URL identificativo) *</label>
              <input className={tableStyles.input} value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="Es. rossi-srl" disabled={!!editItem} />

              <label className={tableStyles.label}>Tipo contratto</label>
              <select className={tableStyles.input} value={form.contractType || ''} onChange={e => setForm({ ...form, contractType: e.target.value })}>
                <option value="">— seleziona —</option>
                <option value="Standard">Standard</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Trial">Trial</option>
                <option value="Personalizzato">Personalizzato</option>
              </select>

              <label className={tableStyles.label}>Scadenza assistenza (vuoto = illimitata ∞)</label>
              <input className={tableStyles.input} type="date" value={form.assistanceExpiresAt || ''} onChange={e => setForm({ ...form, assistanceExpiresAt: e.target.value || null })} />

              <label className={tableStyles.label}>Note</label>
              <textarea className={tableStyles.textarea} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Note interne..." />
            </div>
            <div className={tableStyles.modalFooter}>
              <button className={tableStyles.btnSecondary} onClick={() => setShowForm(false)}>Annulla</button>
              <button className={tableStyles.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
