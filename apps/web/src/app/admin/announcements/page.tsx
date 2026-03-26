'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminPage.module.css'
import t from '../table.module.css'

export default function AdminAnnouncementsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(false)
  const [edit, setEdit] = useState<any>(null)
  const [form, setForm] = useState<any>({type:'NEWS',published:false})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{t:string;ok:boolean}|null>(null)

  const load = async () => { setLoading(true); try { setRows(await api.announcements.findAll()) } catch {} finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const openNew = () => { setEdit(null); setForm({type:'NEWS',published:false}); setMsg(null); setShow(true) }
  const openEdit = (r:any) => { setEdit(r); setForm({title:r.title,body:r.body,type:r.type,published:r.published,expiresAt:r.expiresAt?.slice(0,10)||''}); setMsg(null); setShow(true) }

  const save = async () => {
    setSaving(true)
    try {
      if (edit) await api.announcements.update(edit.id,form); else await api.announcements.create(form)
      setMsg({t:edit?'Aggiornato.':'Creato.',ok:true}); setShow(false); load()
    } catch(e:any) { setMsg({t:e.message,ok:false}) } finally { setSaving(false) }
  }

  const del = async (id:string) => { if(!confirm('Eliminare?'))return; await api.announcements.remove(id); load() }

  const toggle = async (r:any) => {
    await api.announcements.update(r.id,{published:!r.published}); load()
  }

  return (
    <main className={styles.main}>
      <div className={t.hdr}>
        <div><Link href="/admin" className={t.back}>← Admin</Link><h1 className={styles.title}>Annunci</h1></div>
        <button className={t.btnP} onClick={openNew}>+ Nuovo annuncio</button>
      </div>
      {msg && <div className={msg.ok?t.ok:t.err}>{msg.t}<button onClick={()=>setMsg(null)}>×</button></div>}
      {loading ? <p>Caricamento...</p> : (
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead><tr><th>Titolo</th><th>Tipo</th><th>Stato</th><th>Pubblicato il</th><th></th></tr></thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.id}>
                  <td className={t.tdBold}>{r.title}</td>
                  <td><span style={{padding:'2px 8px',borderRadius:4,background:'var(--surface)',fontSize:11,fontWeight:700,fontFamily:'var(--font-mono)'}}>{r.type}</span></td>
                  <td><button onClick={()=>toggle(r)} style={{padding:'3px 10px',borderRadius:6,border:'none',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'var(--font-body)',background:r.published?'#ECFDF5':'var(--surface)',color:r.published?'#059669':'var(--muted)'}}>{r.published?'● Pubblicato':'○ Bozza'}</button></td>
                  <td>{r.publishedAt?new Date(r.publishedAt).toLocaleDateString('it-IT'):'—'}</td>
                  <td className={t.actions}><button className={t.btnE} onClick={()=>openEdit(r)}>Modifica</button><button className={t.btnD} onClick={()=>del(r.id)}>Elimina</button></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={5} className={t.empty}>Nessun annuncio.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {show && (
        <div className={t.overlay}>
          <div className={t.modal}>
            <div className={t.mhdr}><h2>{edit?'Modifica':'Nuovo'} annuncio</h2><button onClick={()=>setShow(false)}>×</button></div>
            <div className={t.mbody}>
              {msg && <div className={msg.ok?t.ok:t.err}>{msg.t}</div>}
              <label className={t.lbl}>Titolo *</label>
              <input className={t.inp} value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Titolo annuncio..."/>
              <label className={t.lbl}>Testo *</label>
              <textarea className={t.ta} rows={3} value={form.body||''} onChange={e=>setForm({...form,body:e.target.value})} placeholder="Contenuto..."/>
              <label className={t.lbl}>Tipo</label>
              <select className={t.inp} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                <option value="NEWS">Novità</option><option value="NEW_COURSE">Nuovo corso</option><option value="WEBINAR">Webinar</option><option value="MAINTENANCE">Manutenzione</option>
              </select>
              <label className={t.lbl}>Scadenza visibilità (vuoto = mai)</label>
              <input className={t.inp} type="date" value={form.expiresAt||''} onChange={e=>setForm({...form,expiresAt:e.target.value||null})}/>
              <label className={t.lbl} style={{marginTop:16,display:'flex',alignItems:'center',gap:8,flexDirection:'row'}}>
                <input type="checkbox" checked={!!form.published} onChange={e=>setForm({...form,published:e.target.checked})}/> Pubblica subito
              </label>
            </div>
            <div className={t.mftr}><button className={t.btnS} onClick={()=>setShow(false)}>Annulla</button><button className={t.btnP} onClick={save} disabled={saving}>{saving?'Salvo...':'Salva'}</button></div>
          </div>
        </div>
      )}
    </main>
  )
}
