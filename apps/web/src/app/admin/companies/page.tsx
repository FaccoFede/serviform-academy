'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { getBrand } from '@/lib/brands'
import styles from '../AdminPage.module.css'
import t from '../table.module.css'

export default function AdminCompaniesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [softwares, setSoftwares] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [show, setShow] = useState(false)
  const [edit, setEdit] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{t:string;ok:boolean}|null>(null)

  const load = async () => { setLoading(true); try { setRows(await api.companies.findAll()) } catch {} finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  useEffect(() => { api.software.findAll().then(setSoftwares).catch(() => {}) }, [])

  const openNew = () => {
    setEdit(null)
    setForm({ softwareIds: [] })
    setMsg(null)
    setShow(true)
  }
  const openEdit = (r: any) => {
    setEdit(r)
    setForm({
      ...r,
      assistanceExpiresAt: r.assistanceExpiresAt?.slice(0,10) || '',
      softwareIds: Array.isArray(r.interests) ? r.interests.map((i: any) => i.softwareId) : [],
    })
    setMsg(null)
    setShow(true)
  }

  const togglePreference = (softwareId: string) => {
    setForm((prev: any) => {
      const current: string[] = Array.isArray(prev.softwareIds) ? prev.softwareIds : []
      const next = current.includes(softwareId)
        ? current.filter(id => id !== softwareId)
        : [...current, softwareId]
      return { ...prev, softwareIds: next }
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      // Invia SEMPRE softwareIds (array anche se vuoto) così il backend può sincronizzare
      // le preferenze, incluso il caso in cui l'utente deseleziona tutto.
      const payload = { ...form, softwareIds: Array.isArray(form.softwareIds) ? form.softwareIds : [] }
      if (edit) await api.companies.update(edit.id, payload); else await api.companies.create(payload)
      setMsg({t: edit ? 'Aggiornata.' : 'Creata.', ok: true}); setShow(false); load()
    } catch(e:any) { setMsg({t:e.message,ok:false}) } finally { setSaving(false) }
  }

  const del = async (id:string,name:string) => {
    if (!confirm(`Eliminare "${name}"?`)) return
    await api.companies.remove(id); load()
  }

  const filtered = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <main className={styles.main}>
      <div className={t.hdr}>
        <div><Link href="/admin" className={t.back}>← Admin</Link><h1 className={styles.title}>Aziende</h1><p className={styles.desc}>{rows.length} aziende</p></div>
        <button className={t.btnP} onClick={openNew}>+ Nuova azienda</button>
      </div>
      {msg && <div className={msg.ok ? t.ok : t.err}>{msg.t}<button onClick={()=>setMsg(null)}>×</button></div>}
      <input className={t.search} placeholder="Cerca azienda..." value={q} onChange={e=>setQ(e.target.value)}/>
      {loading ? <p>Caricamento...</p> : (
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead><tr><th>Azienda</th><th>Contratto</th><th>Scadenza assist.</th><th>Utenti</th><th>Corsi</th><th></th></tr></thead>
            <tbody>
              {filtered.map(r=>(
                <tr key={r.id}>
                  <td className={t.tdBold}>{r.name}</td>
                  <td>{r.contractType||'—'}</td>
                  <td>{r.assistanceExpiresAt ? new Date(r.assistanceExpiresAt).toLocaleDateString('it-IT') : '∞'}</td>
                  <td>{r._count?.members??'—'}</td>
                  <td>{r._count?.courseAssignments??'—'}</td>
                  <td className={t.actions}><button className={t.btnE} onClick={()=>openEdit(r)}>Modifica</button><button className={t.btnD} onClick={()=>del(r.id,r.name)}>Elimina</button></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={6} className={t.empty}>Nessuna azienda.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {show && (
        <div className={t.overlay}>
          <div className={t.modal}>
            <div className={t.mhdr}><h2>{edit?'Modifica':'Nuova'} azienda</h2><button onClick={()=>setShow(false)}>×</button></div>
            <div className={t.mbody}>
              {msg && <div className={msg.ok?t.ok:t.err}>{msg.t}</div>}
              <label className={t.lbl}>Ragione sociale *</label>
              <input className={t.inp} value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Es. Rossi S.r.l."/>
              <label className={t.lbl}>Slug * (es. rossi-srl)</label>
              <input className={t.inp} value={form.slug||''} onChange={e=>setForm({...form,slug:e.target.value})} disabled={!!edit} placeholder="rossi-srl"/>
              <label className={t.lbl}>Tipo contratto</label>
              <select className={t.inp} value={form.contractType||''} onChange={e=>setForm({...form,contractType:e.target.value})}>
                <option value="">—</option>{['Standard','Enterprise','Trial','Personalizzato'].map(v=><option key={v}>{v}</option>)}
              </select>
              <label className={t.lbl}>Scadenza assistenza</label>
              <input className={t.inp} type="date" value={form.assistanceExpiresAt||''} onChange={e=>setForm({...form,assistanceExpiresAt:e.target.value||null})}/>
              <label className={t.lbl}>Note</label>
              <textarea className={t.ta} rows={2} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/>

              <label className={t.lbl}>Preferenze software</label>
              <p style={{fontSize:11,color:'var(--muted)',margin:'0 0 8px',lineHeight:1.5}}>
                Famiglie di software di interesse per questa azienda. Usate per profilazione e filtri.
              </p>
              {softwares.length === 0 ? (
                <div style={{fontSize:12,color:'var(--muted)',padding:'8px 0'}}>Nessun software disponibile.</div>
              ) : (
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {softwares.map(sw => {
                    const selected = Array.isArray(form.softwareIds) && form.softwareIds.includes(sw.id)
                    const brand = getBrand(sw.slug)
                    return (
                      <button
                        key={sw.id}
                        type="button"
                        onClick={() => togglePreference(sw.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 999,
                          border: `1.5px solid ${selected ? brand.color : 'var(--border)'}`,
                          background: selected ? brand.light : 'var(--white)',
                          color: selected ? brand.color : 'var(--muted-dark)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        <span style={{
                          width: 8, height: 8, borderRadius: 2,
                          background: brand.color, display: 'inline-block',
                        }} />
                        {sw.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div className={t.mftr}><button className={t.btnS} onClick={()=>setShow(false)}>Annulla</button><button className={t.btnP} onClick={save} disabled={saving}>{saving?'Salvo...':'Salva'}</button></div>
          </div>
        </div>
      )}
    </main>
  )
}
