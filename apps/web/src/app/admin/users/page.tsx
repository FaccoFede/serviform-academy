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

const ROLE_LABELS: Record<string, string> = {
  USER: 'Utente',
  ADMIN: 'Admin',
  TEAM_ADMIN: 'Team Admin',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
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
      const [usersRes, companiesRes] = await Promise.all([
        fetch(API_URL + '/users', { headers: authHeaders() }),
        fetch(API_URL + '/companies', { headers: authHeaders() }),
      ])
      if (usersRes.ok) setUsers(await usersRes.json())
      if (companiesRes.ok) setCompanies(await companiesRes.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() { setEditItem(null); setForm({ role: 'USER' }); setShowForm(true); setMsg(null) }
  function openEdit(item: any) {
    setEditItem(item)
    setForm({
      email: item.email,
      name: item.name || '',
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      role: item.role,
      companyId: item.membership?.companyId || '',
    })
    setShowForm(true)
    setMsg(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const url = editItem ? API_URL + '/users/' + editItem.id : API_URL + '/users'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).message || 'Errore')
      setMsg({ text: editItem ? 'Utente aggiornato.' : 'Utente creato.', type: 'success' })
      setShowForm(false)
      load()
    } catch (e: any) {
      setMsg({ text: e.message, type: 'error' })
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Eliminare l'utente "${email}"?`)) return
    try {
      await fetch(API_URL + '/users/' + id, { method: 'DELETE', headers: authHeaders() })
      load()
    } catch { /* ignore */ }
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className={styles.main}>
      <div className={tableStyles.pageHeader}>
        <div>
          <Link href="/admin" className={tableStyles.back}>← Admin</Link>
          <h1 className={styles.title}>Utenti</h1>
          <p className={styles.desc}>{users.length} utenti registrati</p>
        </div>
        <button className={tableStyles.btnPrimary} onClick={openCreate}>+ Nuovo utente</button>
      </div>

      {msg && (
        <div className={`${tableStyles.msg} ${msg.type === 'error' ? tableStyles.msgError : tableStyles.msgSuccess}`}>
          {msg.text}
          <button onClick={() => setMsg(null)}>×</button>
        </div>
      )}

      <div className={tableStyles.toolbar}>
        <input
          className={tableStyles.search}
          placeholder="Cerca per email o nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className={tableStyles.loading}>Caricamento...</p>
      ) : (
        <div className={tableStyles.tableWrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nome</th>
                <th>Ruolo</th>
                <th>Azienda</th>
                <th>Ultimo accesso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td className={tableStyles.tdName}>{u.email}</td>
                  <td>{u.name || u.firstName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name : '—'}</td>
                  <td>
                    <span className={tableStyles.tag}>{ROLE_LABELS[u.role] || u.role}</span>
                  </td>
                  <td>{u.membership?.company?.name || <span className={tableStyles.none}>—</span>}</td>
                  <td>
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleDateString('it-IT')
                      : <span className={tableStyles.none}>mai</span>}
                  </td>
                  <td className={tableStyles.actions}>
                    <button className={tableStyles.btnEdit} onClick={() => openEdit(u)}>Modifica</button>
                    <button className={tableStyles.btnDelete} onClick={() => handleDelete(u.id, u.email)}>Elimina</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className={tableStyles.empty}>Nessun utente trovato.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className={tableStyles.overlay}>
          <div className={tableStyles.modal}>
            <div className={tableStyles.modalHeader}>
              <h2>{editItem ? 'Modifica utente' : 'Nuovo utente'}</h2>
              <button className={tableStyles.modalClose} onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className={tableStyles.modalBody}>
              {msg && (
                <div className={`${tableStyles.msg} ${msg.type === 'error' ? tableStyles.msgError : tableStyles.msgSuccess}`}>
                  {msg.text}
                </div>
              )}

              <label className={tableStyles.label}>Email *</label>
              <input className={tableStyles.input} type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@azienda.it" disabled={!!editItem} />

              {!editItem && (
                <>
                  <label className={tableStyles.label}>Password *</label>
                  <input className={tableStyles.input} type="password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password iniziale" />
                </>
              )}

              <label className={tableStyles.label}>Nome</label>
              <input className={tableStyles.input} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />

              <label className={tableStyles.label}>Ruolo</label>
              <select className={tableStyles.input} value={form.role || 'USER'} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="USER">Utente</option>
                <option value="TEAM_ADMIN">Team Admin</option>
                <option value="ADMIN">Admin</option>
              </select>

              <label className={tableStyles.label}>Azienda</label>
              <select className={tableStyles.input} value={form.companyId || ''} onChange={e => setForm({ ...form, companyId: e.target.value || null })}>
                <option value="">— nessuna azienda —</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
