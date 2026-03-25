'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../AdminPage.module.css'
import tableStyles from '../companies/CompaniesAdmin.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function authHeaders() {
  const token = localStorage.getItem('sa_token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }
}

const TYPE_LABELS: Record<string, string> = {
  NEWS: 'Novità',
  NEW_COURSE: 'Nuovo corso',
  WEBINAR: 'Webinar',
  MAINTENANCE: 'Manutenzione',
}

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<any>({ type: 'NEWS', published: false })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(API_URL + '/announcements/admin/all', { headers: authHeaders() })
      if (res.ok) setItems(await res.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() { setEditItem(null); setForm({ type: 'NEWS', published: false }); setShowForm(true); setMsg(null) }
  function openEdit(item: any) {
    setEditItem(item)
    setForm({
      title: item.title,
      body: item.body,
      type: item.type,
      published: item.published,
      expiresAt: item.expiresAt ? item.expiresAt.slice(0, 10) : '',
    })
    setShowForm(true)
    setMsg(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const url = editItem ? API_URL + '/announcements/' + editItem.id : API_URL + '/announcements'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).message || 'Errore')
      setMsg({ text: editItem ? 'Annuncio aggiornato.' : 'Annuncio creato.', type: 'success' })
      setShowForm(false)
      load()
    } catch (e: any) {
      setMsg({ text: e.message, type: 'error' })
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo annuncio?')) return
    try {
      await fetch(API_URL + '/announcements/' + id, { method: 'DELETE', headers: authHeaders() })
      load()
    } catch { /* ignore */ }
  }

  async function togglePublish(item: any) {
    try {
      await fetch(API_URL + '/announcements/' + item.id, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ published: !item.published, publishedAt: !item.published ? new Date().toISOString() : null }),
      })
      load()
    } catch { /* ignore */ }
  }

  return (
    <main className={styles.main}>
      <div className={tableStyles.pageHeader}>
        <div>
          <Link href="/admin" className={tableStyles.back}>← Admin</Link>
          <h1 className={styles.title}>Annunci</h1>
          <p className={styles.desc}>Novità, nuovi corsi, webinar e comunicazioni per gli utenti</p>
        </div>
        <button className={tableStyles.btnPrimary} onClick={openCreate}>+ Nuovo annuncio</button>
      </div>

      {msg && (
        <div className={`${tableStyles.msg} ${msg.type === 'error' ? tableStyles.msgError : tableStyles.msgSuccess}`}>
          {msg.text}
          <button onClick={() => setMsg(null)}>×</button>
        </div>
      )}

      {loading ? (
        <p className={tableStyles.loading}>Caricamento...</p>
      ) : (
        <div className={tableStyles.tableWrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Titolo</th>
                <th>Tipo</th>
                <th>Stato</th>
                <th>Pubblicato il</th>
                <th>Scadenza</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className={tableStyles.tdName}>{item.title}</td>
                  <td><span className={tableStyles.tag}>{TYPE_LABELS[item.type] || item.type}</span></td>
                  <td>
                    <button
                      className={item.published ? tableStyles.btnEdit : tableStyles.btnDelete}
                      onClick={() => togglePublish(item)}
                      style={{ minWidth: 90 }}
                    >
                      {item.published ? '● Pubblicato' : '○ Bozza'}
                    </button>
                  </td>
                  <td>
                    {item.publishedAt
                      ? new Date(item.publishedAt).toLocaleDateString('it-IT')
                      : <span className={tableStyles.none}>—</span>}
                  </td>
                  <td>
                    {item.expiresAt
                      ? new Date(item.expiresAt).toLocaleDateString('it-IT')
                      : <span className={tableStyles.infinity}>∞</span>}
                  </td>
                  <td className={tableStyles.actions}>
                    <button className={tableStyles.btnEdit} onClick={() => openEdit(item)}>Modifica</button>
                    <button className={tableStyles.btnDelete} onClick={() => handleDelete(item.id)}>Elimina</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className={tableStyles.empty}>Nessun annuncio. Crea il primo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className={tableStyles.overlay}>
          <div className={tableStyles.modal}>
            <div className={tableStyles.modalHeader}>
              <h2>{editItem ? 'Modifica annuncio' : 'Nuovo annuncio'}</h2>
              <button className={tableStyles.modalClose} onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className={tableStyles.modalBody}>
              {msg && (
                <div className={`${tableStyles.msg} ${msg.type === 'error' ? tableStyles.msgError : tableStyles.msgSuccess}`}>
                  {msg.text}
                </div>
              )}

              <label className={tableStyles.label}>Titolo *</label>
              <input className={tableStyles.input} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titolo annuncio..." />

              <label className={tableStyles.label}>Testo *</label>
              <textarea className={tableStyles.textarea} value={form.body || ''} onChange={e => setForm({ ...form, body: e.target.value })} rows={4} placeholder="Contenuto dell'annuncio..." />

              <label className={tableStyles.label}>Tipo</label>
              <select className={tableStyles.input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="NEWS">Novità</option>
                <option value="NEW_COURSE">Nuovo corso</option>
                <option value="WEBINAR">Webinar</option>
                <option value="MAINTENANCE">Manutenzione</option>
              </select>

              <label className={tableStyles.label}>Scadenza visibilità (vuoto = nessuna)</label>
              <input className={tableStyles.input} type="date" value={form.expiresAt || ''} onChange={e => setForm({ ...form, expiresAt: e.target.value || null })} />

              <label className={tableStyles.label} style={{ marginTop: 18 }}>
                <input type="checkbox" checked={!!form.published} onChange={e => setForm({ ...form, published: e.target.checked })} style={{ marginRight: 8 }} />
                Pubblica subito
              </label>
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
