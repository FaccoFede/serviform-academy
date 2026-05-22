'use client'
import { useState, useEffect, useMemo } from 'react'
import { Pencil, Trash2, KeyRound, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { API_URL } from '@/lib/config'
import PageHeader from '../_components/PageHeader'
import styles from '../AdminPage.module.css'
import t from '../table.module.css'

const ROLE: Record<string, string> = { USER: 'Utente', ADMIN: 'Admin', TEAM_ADMIN: 'Team Admin' }
const PAGE_SIZE = 20

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [companiesError, setCompaniesError] = useState(false)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [show, setShow] = useState(false)
  const [edit, setEdit] = useState<any>(null)
  const [form, setForm] = useState<any>({ role: 'USER', companyId: '', mustChangePassword: true })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null)
  // Reset password modal
  const [resetTarget, setResetTarget] = useState<any>(null)
  const [resetPwd, setResetPwd] = useState('')
  const [resetForce, setResetForce] = useState(true)
  const [resetSaving, setResetSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try { setUsers(await api.users.findAll()) } catch (e: any) { setMsg({ t: e.message, ok: false }) }
    try { setCompanies(await api.companies.findAll()); setCompaniesError(false) } catch { setCompaniesError(true) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1) }, [q])

  const openNew = () => { setEdit(null); setForm({ role: 'USER', companyId: '', mustChangePassword: true }); setMsg(null); setShow(true) }
  const openEdit = (r: any) => { setEdit(r); setForm({ email: r.email, name: r.name || '', role: r.role, companyId: r.membership?.company?.id || '' }); setMsg(null); setShow(true) }

  const save = async () => {
    setSaving(true)
    try {
      if (edit) await api.users.update(edit.id, form)
      else await api.users.create(form)
      setMsg({ t: edit ? 'Aggiornato.' : 'Creato.', ok: true }); setShow(false); load()
    } catch (e: any) { setMsg({ t: e.message, ok: false }) }
    finally { setSaving(false) }
  }

  const del = async (id: string, email: string) => {
    if (!confirm(`Eliminare "${email}"?`)) return
    try { await api.users.remove(id); load() } catch (e: any) { setMsg({ t: (e as any).message, ok: false }) }
  }

  async function handleResetPassword() {
    if (!resetTarget || !resetPwd) return
    setResetSaving(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('sa_token') : null
      const res = await fetch(`${API_URL}/auth/admin/reset-password/${resetTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ newPassword: resetPwd, forceChange: resetForce }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setMsg({ t: `Password reimpostata per ${resetTarget.email}.`, ok: true })
      setResetTarget(null); setResetPwd('')
    } catch (e: any) { setMsg({ t: e.message, ok: false }) }
    finally { setResetSaving(false) }
  }

  const filtered = useMemo(
    () => users.filter(u =>
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      (u.name || '').toLowerCase().includes(q.toLowerCase()),
    ),
    [users, q],
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <main className={styles.main}>
      <PageHeader
        title="Utenti"
        description={`${filtered.length} ${filtered.length === 1 ? 'utente' : 'utenti'}${q ? ` (filtrati su ${users.length})` : ''}`}
        action={
          <button className={t.btnP} onClick={openNew}>
            <Plus size={14} />
            Nuovo utente
          </button>
        }
      />
      {msg && <div className={msg.ok ? t.ok : t.err}>{msg.t}<button onClick={() => setMsg(null)}>×</button></div>}
      {companiesError && <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1px solid #F6CD4D', borderRadius: 8, fontSize: 13, marginBottom: 16, color: '#92400E' }}>⚠ Tabella aziende non disponibile. Esegui prima la migrazione B2B.</div>}
      <div className={t.searchBar}>
        <input className={t.search} placeholder="Cerca email o nome..." value={q} onChange={e => setQ(e.target.value)}/>
      </div>
      {loading ? <p>Caricamento...</p> : (
        <>
          <div className={t.tableWrap}>
            <table className={t.table}>
              <thead><tr><th>Email</th><th>Nome</th><th>Ruolo</th><th>Azienda</th><th>Cambio pwd</th><th></th></tr></thead>
              <tbody>
                {paginated.map(r => (
                  <tr key={r.id}>
                    <td className={t.tdBold}>{r.email}</td>
                    <td>{r.name || '—'}</td>
                    <td><span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--surface)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{ROLE[r.role] || r.role}</span></td>
                    <td>{r.membership?.company?.name || '—'}</td>
                    <td>{r.mustChangePassword ? <span style={{ fontSize: 11, color: '#D97706', fontWeight: 700 }}>⚠ Richiesto</span> : <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>✓ OK</span>}</td>
                    <td className={t.actionsCell}>
                      <button className={t.iconBtn} title="Modifica" aria-label="Modifica" onClick={() => openEdit(r)}>
                        <Pencil size={14} />
                      </button>
                      <button className={t.iconBtn} title="Reset password" aria-label="Reset password" onClick={() => { setResetTarget(r); setResetPwd(''); setResetForce(true) }}>
                        <KeyRound size={14} />
                      </button>
                      <button className={t.iconBtn} data-variant="danger" title="Elimina" aria-label="Elimina" onClick={() => del(r.id, r.email)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={6} className={t.empty}>Nessun utente trovato.</td></tr>}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={t.pagination}>
              <span className={t.paginationInfo}>Pagina {currentPage} di {totalPages}</span>
              <div className={t.paginationCtrls}>
                <button type="button" className={t.pageBtn} disabled={currentPage === 1} onClick={() => setPage(p => Math.max(1, p - 1))} aria-label="Pagina precedente">
                  <ChevronLeft size={14} />
                </button>
                <button type="button" className={t.pageBtn} disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} aria-label="Pagina successiva">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal crea/modifica utente */}
      {show && (
        <div className={t.overlay}>
          <div className={t.modal}>
            <div className={t.mhdr}><h2>{edit ? 'Modifica' : 'Nuovo'} utente</h2><button onClick={() => setShow(false)}>×</button></div>
            <div className={t.mbody}>
              {msg && <div className={msg.ok ? t.ok : t.err}>{msg.t}</div>}
              <label className={t.lbl}>Email *</label>
              <input className={t.inp} type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} disabled={!!edit} placeholder="email@azienda.it"/>
              {!edit && <><label className={t.lbl}>Password iniziale *</label><input className={t.inp} type="password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password iniziale"/></>}
              <label className={t.lbl}>Nome</label>
              <input className={t.inp} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome completo"/>
              <label className={t.lbl}>Ruolo</label>
              <select className={t.inp} value={form.role || 'USER'} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="USER">Utente</option><option value="TEAM_ADMIN">Team Admin</option><option value="ADMIN">Admin</option>
              </select>
              <label className={t.lbl}>Azienda{companiesError ? ' (non disponibile)' : ''}</label>
              {!companiesError ? (
                <select className={t.inp} value={form.companyId || ''} onChange={e => setForm({ ...form, companyId: e.target.value || null })}>
                  <option value="">— nessuna azienda —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : <input className={t.inp} value="Migrazione richiesta" disabled style={{ opacity: .5 }}/>}
              {!edit && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
                  <input type="checkbox" checked={!!form.mustChangePassword} onChange={e => setForm({ ...form, mustChangePassword: e.target.checked })}/>
                  Forza cambio password al primo accesso
                </label>
              )}
            </div>
            <div className={t.mftr}><button className={t.btnS} onClick={() => setShow(false)}>Annulla</button><button className={t.btnP} onClick={save} disabled={saving}>{saving ? 'Salvo...' : 'Salva'}</button></div>
          </div>
        </div>
      )}

      {/* Modal reset password */}
      {resetTarget && (
        <div className={t.overlay}>
          <div className={t.modal}>
            <div className={t.mhdr}><h2>Reset password — {resetTarget.email}</h2><button onClick={() => setResetTarget(null)}>×</button></div>
            <div className={t.mbody}>
              <label className={t.lbl}>Nuova password *</label>
              <input className={t.inp} type="password" value={resetPwd} onChange={e => setResetPwd(e.target.value)} placeholder="Min. 8 caratteri"/>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>
                <input type="checkbox" checked={resetForce} onChange={e => setResetForce(e.target.checked)}/>
                Forza cambio password al prossimo accesso
              </label>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>La password viene salvata con hashing sicuro. L'utente non viene notificato automaticamente: comunicagli la nuova password in modo sicuro.</p>
            </div>
            <div className={t.mftr}><button className={t.btnS} onClick={() => setResetTarget(null)}>Annulla</button><button className={t.btnP} onClick={handleResetPassword} disabled={resetSaving || !resetPwd}>{resetSaving ? 'Salvo...' : 'Reimposta password'}</button></div>
          </div>
        </div>
      )}
    </main>
  )
}
