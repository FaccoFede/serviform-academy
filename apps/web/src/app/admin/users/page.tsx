'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminPage.module.css'
import t from '../companies/Companies.module.css'

const ROLE_LABEL: Record<string, string> = { USER: 'Utente', ADMIN: 'Admin', TEAM_ADMIN: 'Team Admin' }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<any>({ role: 'USER' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [u, c] = await Promise.all([api.users.findAll(), api.companies.findAll()])
      setUsers(u); setCompanies(c)
    } catch { setUsers([]) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function openCreate() { setEditItem(null); setForm({ role: 'USER' }); setShowForm(true); setMsg(null) }
  function openEdit(item: any) {
    setEditItem(item)
    setForm({ email: item.email, name: item.name || '', role: item.role, companyId: item.membership?.companyId || '' })
    setShowForm(true); setMsg(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editItem) {
        await api.users.update(editItem.id, form)
        setMsg({ text: 'Utente aggiornato.', type: 'ok' })
      } else {
        await api.users.create(form)
        setMsg({ text: 'Utente creato.', type: 'ok' })
      }
      setShowForm(false); load()
    } catch (e: any) { setMsg({ text: e.message, type: 'err' }) }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Eliminare "${email}"?`)) return
    try { await api.users.remove(id); load() } catch { /* ignore */ }
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className={styles.main}>
      <div className={t.hdr}>
        <div>
          <Link href="/admin" className={t.back}>← Admin</Link>
          <h1 className={styles.title}>Utenti</h1>
          <p className={styles.desc}>{users.length} utenti</p>
        </div>
        <button className={t.btnPrimary} onClick={openCreate}>+ Nuovo utente</button>
      </div>

      {msg && <div className={`${t.msg} ${msg.type === 'err' ? t.msgErr : t.msgOk}`}>{msg.text} <button onClick={() => setMsg(null)}>×</button></div>}

      <input className={t.search} placeholder="Cerca per email o nome..." value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? <p className={t.loading}>Caricamento...</p> : (
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead><tr><th>Email</th><th>Nome</th><th>Ruolo</th><th>Azienda</th><th>Ultimo accesso</th><th></th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td className={t.tdBold}>{u.email}</td>
                  <td>{u.name || '—'}</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--surface)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{ROLE_LABEL[u.role] || u.role}</span></td>
                  <td>{u.membership?.company?.name || <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                  <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('it-IT') : <span style={{ color: 'var(--muted)' }}>mai</span>}</td>
                  <td className={t.actions}>
                    <button className={t.btnEdit} onClick={() => openEdit(u)}>Modifica</button>
                    <button className={t.btnDel} onClick={() => handleDelete(u.id, u.email)}>Elimina</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className={t.empty}>Nessun utente trovato.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className={t.overlay}>
          <div className={t.modal}>
            <div className={t.modalHdr}><h2>{editItem ? 'Modifica utente' : 'Nuovo utente'}</h2><button onClick={() => setShowForm(false)}>×</button></div>
            <div className={t.modalBody}>
              {msg && <div className={`${t.msg} ${msg.type === 'err' ? t.msgErr : t.msgOk}`}>{msg.text}</div>}
              <label className={t.label}>Email *</label>
              <input className={t.input} type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} disabled={!!editItem} placeholder="email@azienda.it" />
              {!editItem && (
                <>
                  <label className={t.label}>Password *</label>
                  <input className={t.input} type="password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password iniziale" />
                </>
              )}
              <label className={t.label}>Nome</label>
              <input className={t.input} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
              <label className={t.label}>Ruolo</label>
              <select className={t.input} value={form.role || 'USER'} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="USER">Utente</option>
                <option value="TEAM_ADMIN">Team Admin</option>
                <option value="ADMIN">Admin</option>
              </select>
              <label className={t.label}>Azienda</label>
              <select className={t.input} value={form.companyId || ''} onChange={e => setForm({ ...form, companyId: e.target.value || null })}>
                <option value="">— nessuna —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
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
