'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminPage.module.css'
import t from './Companies.module.css'

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null)

  async function load() {
    setLoading(true)
    try { setCompanies(await api.companies.findAll()) } catch { setCompanies([]) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() { setEditItem(null); setForm({}); setShowForm(true); setMsg(null) }
  function openEdit(item: any) {
    setEditItem(item)
    setForm({ ...item, assistanceExpiresAt: item.assistanceExpiresAt ? item.assistanceExpiresAt.slice(0, 10) : '' })
    setShowForm(true); setMsg(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editItem) {
        await api.companies.update(editItem.id, form)
        setMsg({ text: 'Azienda aggiornata.', type: 'ok' })
      } else {
        await api.companies.create(form)
        setMsg({ text: 'Azienda creata.', type: 'ok' })
      }
      setShowForm(false); load()
    } catch (e: any) { setMsg({ text: e.message, type: 'err' }) }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Eliminare "${name}"?`)) return
    try { await api.companies.remove(id); load() } catch { /* ignore */ }
  }

  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <main className={styles.main}>
      <div className={t.hdr}>
        <div>
          <Link href="/admin" className={t.back}>← Admin</Link>
          <h1 className={styles.title}>Aziende</h1>
          <p className={styles.desc}>{companies.length} aziende</p>
        </div>
        <button className={t.btnPrimary} onClick={openCreate}>+ Nuova azienda</button>
      </div>

      {msg && <div className={`${t.msg} ${msg.type === 'err' ? t.msgErr : t.msgOk}`}>{msg.text} <button onClick={() => setMsg(null)}>×</button></div>}

      <input className={t.search} placeholder="Cerca azienda..." value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? <p className={t.loading}>Caricamento...</p> : (
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead><tr><th>Azienda</th><th>Contratto</th><th>Scadenza assistenza</th><th>Utenti</th><th>Corsi</th><th></th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className={t.tdBold}>{c.name}</td>
                  <td>{c.contractType || '—'}</td>
                  <td>{c.assistanceExpiresAt ? new Date(c.assistanceExpiresAt).toLocaleDateString('it-IT') : <span className={t.inf}>∞</span>}</td>
                  <td>{c._count?.members ?? '—'}</td>
                  <td>{c._count?.courseAssignments ?? '—'}</td>
                  <td className={t.actions}>
                    <button className={t.btnEdit} onClick={() => openEdit(c)}>Modifica</button>
                    <button className={t.btnDel} onClick={() => handleDelete(c.id, c.name)}>Elimina</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className={t.empty}>Nessuna azienda.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className={t.overlay}>
          <div className={t.modal}>
            <div className={t.modalHdr}><h2>{editItem ? 'Modifica azienda' : 'Nuova azienda'}</h2><button onClick={() => setShowForm(false)}>×</button></div>
            <div className={t.modalBody}>
              {msg && <div className={`${t.msg} ${msg.type === 'err' ? t.msgErr : t.msgOk}`}>{msg.text}</div>}
              <label className={t.label}>Ragione sociale *</label>
              <input className={t.input} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Es. Rossi S.r.l." />
              <label className={t.label}>Slug *</label>
              <input className={t.input} value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="Es. rossi-srl" disabled={!!editItem} />
              <label className={t.label}>Tipo contratto</label>
              <select className={t.input} value={form.contractType || ''} onChange={e => setForm({ ...form, contractType: e.target.value })}>
                <option value="">— seleziona —</option>
                {['Standard', 'Enterprise', 'Trial', 'Personalizzato'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <label className={t.label}>Scadenza assistenza (vuoto = ∞)</label>
              <input className={t.input} type="date" value={form.assistanceExpiresAt || ''} onChange={e => setForm({ ...form, assistanceExpiresAt: e.target.value || null })} />
              <label className={t.label}>Note</label>
              <textarea className={t.textarea} rows={3} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
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
