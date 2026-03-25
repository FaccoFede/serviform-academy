'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminPage.module.css'
import t from '../companies/Companies.module.css'

const TYPE_LABEL: Record<string, string> = { NEWS: 'Novità', NEW_COURSE: 'Nuovo corso', WEBINAR: 'Webinar', MAINTENANCE: 'Manutenzione' }

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<any>({ type: 'NEWS', published: false })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null)

  async function load() {
    setLoading(true)
    try { setItems(await api.announcements.findAll()) } catch { setItems([]) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function openCreate() { setEditItem(null); setForm({ type: 'NEWS', published: false }); setShowForm(true); setMsg(null) }
  function openEdit(item: any) {
    setEditItem(item)
    setForm({ title: item.title, body: item.body, type: item.type, published: item.published, expiresAt: item.expiresAt ? item.expiresAt.slice(0, 10) : '' })
    setShowForm(true); setMsg(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editItem) { await api.announcements.update(editItem.id, form); setMsg({ text: 'Aggiornato.', type: 'ok' }) }
      else { await api.announcements.create(form); setMsg({ text: 'Creato.', type: 'ok' }) }
      setShowForm(false); load()
    } catch (e: any) { setMsg({ text: e.message, type: 'err' }) }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo annuncio?')) return
    try { await api.announcements.remove(id); load() } catch { /* ignore */ }
  }

  async function togglePublish(item: any) {
    try {
      await api.announcements.update(item.id, { published: !item.published, publishedAt: !item.published ? new Date().toISOString() : null })
      load()
    } catch { /* ignore */ }
  }

  return (
    <main className={styles.main}>
      <div className={t.hdr}>
        <div>
          <Link href="/admin" className={t.back}>← Admin</Link>
          <h1 className={styles.title}>Annunci</h1>
          <p className={styles.desc}>Novità e comunicazioni per gli utenti</p>
        </div>
        <button className={t.btnPrimary} onClick={openCreate}>+ Nuovo annuncio</button>
      </div>

      {msg && <div className={`${t.msg} ${msg.type === 'err' ? t.msgErr : t.msgOk}`}>{msg.text} <button onClick={() => setMsg(null)}>×</button></div>}

      {loading ? <p className={t.loading}>Caricamento...</p> : (
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead><tr><th>Titolo</th><th>Tipo</th><th>Stato</th><th>Pubblicato il</th><th>Scadenza</th><th></th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className={t.tdBold}>{item.title}</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--surface)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{TYPE_LABEL[item.type] || item.type}</span></td>
                  <td>
                    <button
                      onClick={() => togglePublish(item)}
                      style={{ padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', background: item.published ? '#ECFDF5' : 'var(--surface)', color: item.published ? '#059669' : 'var(--muted)' }}
                    >
                      {item.published ? '● Pubblicato' : '○ Bozza'}
                    </button>
                  </td>
                  <td>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('it-IT') : '—'}</td>
                  <td>{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString('it-IT') : <span className={t.inf}>∞</span>}</td>
                  <td className={t.actions}>
                    <button className={t.btnEdit} onClick={() => openEdit(item)}>Modifica</button>
                    <button className={t.btnDel} onClick={() => handleDelete(item.id)}>Elimina</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={6} className={t.empty}>Nessun annuncio. Creane uno.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className={t.overlay}>
          <div className={t.modal}>
            <div className={t.modalHdr}><h2>{editItem ? 'Modifica annuncio' : 'Nuovo annuncio'}</h2><button onClick={() => setShowForm(false)}>×</button></div>
            <div className={t.modalBody}>
              {msg && <div className={`${t.msg} ${msg.type === 'err' ? t.msgErr : t.msgOk}`}>{msg.text}</div>}
              <label className={t.label}>Titolo *</label>
              <input className={t.input} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titolo annuncio..." />
              <label className={t.label}>Testo *</label>
              <textarea className={t.textarea} rows={4} value={form.body || ''} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Contenuto..." />
              <label className={t.label}>Tipo</label>
              <select className={t.input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="NEWS">Novità</option>
                <option value="NEW_COURSE">Nuovo corso</option>
                <option value="WEBINAR">Webinar</option>
                <option value="MAINTENANCE">Manutenzione</option>
              </select>
              <label className={t.label}>Scadenza visibilità (vuoto = nessuna)</label>
              <input className={t.input} type="date" value={form.expiresAt || ''} onChange={e => setForm({ ...form, expiresAt: e.target.value || null })} />
              <label className={t.label} style={{ marginTop: 16 }}>
                <input type="checkbox" checked={!!form.published} onChange={e => setForm({ ...form, published: e.target.checked })} style={{ marginRight: 8 }} />
                Pubblica subito
              </label>
            </div>
            <div className={t.modalFtr}>
              <button className={t.btnSec} onClick={() => setShowForm(false)}>Annulla</button>
              <button className={t.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
