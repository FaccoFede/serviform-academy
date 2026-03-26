'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminPage.module.css'
import t from '../table.module.css'

const ROLE: Record<string,string> = {USER:'Utente',ADMIN:'Admin',TEAM_ADMIN:'Team Admin'}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [companiesError, setCompaniesError] = useState(false)
  const [q, setQ] = useState('')
  const [show, setShow] = useState(false)
  const [edit, setEdit] = useState<any>(null)
  const [form, setForm] = useState<any>({role:'USER',companyId:''})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{t:string;ok:boolean}|null>(null)

  const load = async () => {
    setLoading(true)
    try { setUsers(await api.users.findAll()) } catch (e: any) { setMsg({t:e.message,ok:false}) }
    try {
      const c = await api.companies.findAll()
      setCompanies(c)
      setCompaniesError(false)
    } catch {
      setCompaniesError(true)
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openNew = () => { setEdit(null); setForm({role:'USER',companyId:''}); setMsg(null); setShow(true) }
  const openEdit = (r:any) => {
    setEdit(r)
    const companyId = r.membership?.company?.id || ''
    setForm({email:r.email,name:r.name||'',role:r.role,companyId})
    setMsg(null); setShow(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        companyId: form.companyId || null,
      }
      if (edit) {
        await api.users.update(edit.id, payload)
        setMsg({t:'Utente aggiornato.',ok:true})
      } else {
        await api.users.create(payload)
        setMsg({t:'Utente creato.',ok:true})
      }
      setShow(false); load()
    } catch(e:any) { setMsg({t:e.message,ok:false}) }
    finally { setSaving(false) }
  }

  const del = async (id:string,email:string) => {
    if (!confirm(`Eliminare "${email}"?`)) return
    try { await api.users.remove(id); load() } catch(e:any) { setMsg({t:(e as any).message,ok:false}) }
  }

  const filtered = users.filter(u => u.email.toLowerCase().includes(q.toLowerCase()) || (u.name||'').toLowerCase().includes(q.toLowerCase()))

  return (
    <main className={styles.main}>
      <div className={t.hdr}>
        <div><Link href="/admin" className={t.back}>← Admin</Link><h1 className={styles.title}>Utenti</h1><p className={styles.desc}>{users.length} utenti registrati</p></div>
        <button className={t.btnP} onClick={openNew}>+ Nuovo utente</button>
      </div>

      {msg && <div className={msg.ok?t.ok:t.err}>{msg.t}<button onClick={()=>setMsg(null)}>×</button></div>}

      {companiesError && (
        <div style={{padding:'10px 14px',background:'#FFFBEB',border:'1px solid #F6CD4D',borderRadius:8,fontSize:13,marginBottom:16,color:'#92400E'}}>
          ⚠ Le aziende non sono ancora disponibili. Esegui prima <code style={{background:'rgba(0,0,0,0.06)',padding:'1px 6px',borderRadius:4}}>apply-migration.ts</code> per creare le tabelle B2B.
        </div>
      )}

      <input className={t.search} placeholder="Cerca email o nome..." value={q} onChange={e=>setQ(e.target.value)}/>

      {loading ? <p style={{color:'var(--muted)',fontSize:14}}>Caricamento...</p> : (
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead><tr><th>Email</th><th>Nome</th><th>Ruolo</th><th>Azienda</th><th>Ultimo accesso</th><th></th></tr></thead>
            <tbody>
              {filtered.map(r=>(
                <tr key={r.id}>
                  <td className={t.tdBold}>{r.email}</td>
                  <td>{r.name||'—'}</td>
                  <td><span style={{padding:'2px 8px',borderRadius:4,background:'var(--surface)',fontSize:11,fontWeight:700,fontFamily:'var(--font-mono)'}}>{ROLE[r.role]||r.role}</span></td>
                  <td>{r.membership?.company?.name||<span style={{color:'var(--muted)'}}>—</span>}</td>
                  <td>{r.lastLoginAt?new Date(r.lastLoginAt).toLocaleDateString('it-IT'):<span style={{color:'var(--muted)'}}>mai</span>}</td>
                  <td className={t.actions}><button className={t.btnE} onClick={()=>openEdit(r)}>Modifica</button><button className={t.btnD} onClick={()=>del(r.id,r.email)}>Elimina</button></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={6} className={t.empty}>Nessun utente trovato.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {show && (
        <div className={t.overlay}>
          <div className={t.modal}>
            <div className={t.mhdr}><h2>{edit?'Modifica':'Nuovo'} utente</h2><button onClick={()=>setShow(false)}>×</button></div>
            <div className={t.mbody}>
              {msg && <div className={msg.ok?t.ok:t.err}>{msg.t}</div>}
              <label className={t.lbl}>Email *</label>
              <input className={t.inp} type="email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})} disabled={!!edit} placeholder="email@azienda.it"/>
              {!edit && (
                <><label className={t.lbl}>Password *</label>
                <input className={t.inp} type="password" value={form.password||''} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Password iniziale"/></>
              )}
              <label className={t.lbl}>Nome</label>
              <input className={t.inp} value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nome completo"/>
              <label className={t.lbl}>Ruolo</label>
              <select className={t.inp} value={form.role||'USER'} onChange={e=>setForm({...form,role:e.target.value})}>
                <option value="USER">Utente</option>
                <option value="TEAM_ADMIN">Team Admin</option>
                <option value="ADMIN">Admin</option>
              </select>
              <label className={t.lbl}>
                Azienda
                {companiesError && <span style={{color:'var(--muted)',fontWeight:600,marginLeft:8,textTransform:'none',letterSpacing:0}}>(non disponibile — migrazione mancante)</span>}
              </label>
              {!companiesError ? (
                <select className={t.inp} value={form.companyId||''} onChange={e=>setForm({...form,companyId:e.target.value})}>
                  <option value="">— nessuna azienda —</option>
                  {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : (
                <input className={t.inp} value="Crea prima le aziende" disabled style={{opacity:.5}}/>
              )}
            </div>
            <div className={t.mftr}>
              <button className={t.btnS} onClick={()=>setShow(false)}>Annulla</button>
              <button className={t.btnP} onClick={save} disabled={saving}>{saving?'Salvo...':'Salva'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
