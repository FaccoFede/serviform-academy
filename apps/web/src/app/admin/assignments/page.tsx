'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminPage.module.css'
import t from '../table.module.css'

export default function AdminAssignmentsPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [sel, setSel] = useState<any>(null)
  const [asgn, setAsgn] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState<any>({accessType:'ACTIVE'})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{t:string;ok:boolean}|null>(null)

  useEffect(() => { Promise.all([api.companies.findAll(), api.courses.findAll()]).then(([c,co])=>{ setCompanies(c); setCourses(co) }).catch(()=>{}) }, [])

  const selectCo = async (c:any) => {
    setSel(c); setMsg(null); setLoading(true)
    try { setAsgn(await api.assignments.findByCompany(c.id)) } catch { setAsgn([]) } finally { setLoading(false) }
  }

  const assign = async () => {
    if (!sel || !form.courseId) return
    setSaving(true)
    try {
      await api.assignments.assignToCompany(sel.id, form.courseId, form)
      setMsg({t:'Corso assegnato.',ok:true}); setShow(false)
      setAsgn(await api.assignments.findByCompany(sel.id))
    } catch(e:any) { setMsg({t:e.message,ok:false}) } finally { setSaving(false) }
  }

  const changeAccess = async (id:string, accessType:string) => {
    await api.assignments.updateCompany(id,{accessType})
    setAsgn(await api.assignments.findByCompany(sel.id))
  }

  const remove = async (id:string) => {
    if (!confirm('Rimuovere assegnazione?')) return
    await api.assignments.removeCompany(id)
    setAsgn(await api.assignments.findByCompany(sel.id))
  }

  const assigned = new Set(asgn.map((a:any)=>a.courseId))
  const available = courses.filter(c=>!assigned.has(c.id))

  return (
    <main className={styles.main}>
      <div className={t.hdr} style={{marginBottom:20}}>
        <div><Link href="/admin" className={t.back}>← Admin</Link><h1 className={styles.title}>Assegnazioni corsi</h1></div>
      </div>
      {msg && <div className={msg.ok?t.ok:t.err}>{msg.t}<button onClick={()=>setMsg(null)}>×</button></div>}
      <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:24,alignItems:'start'}}>
        {/* Lista aziende */}
        <div style={{border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden'}}>
          <div style={{padding:'10px 14px',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.7px',color:'var(--muted)',fontFamily:'var(--font-mono)',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>Aziende</div>
          {companies.map(c=>(
            <button key={c.id} onClick={()=>selectCo(c)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',background:sel?.id===c.id?'var(--red-light)':'none',border:'none',borderBottom:'1px solid var(--border)',cursor:'pointer',textAlign:'left',fontFamily:'var(--font-body)'}}>
              <span style={{fontSize:13.5,fontWeight:700,color:sel?.id===c.id?'var(--red)':'var(--ink)'}}>{c.name}</span>
              <span style={{fontSize:11,fontFamily:'var(--font-mono)',color:'var(--muted)'}}>{c._count?.courseAssignments??0}</span>
            </button>
          ))}
          {!companies.length && <p style={{padding:'16px 14px',fontSize:13,color:'var(--muted)'}}>Nessuna azienda.</p>}
        </div>
        {/* Assegnazioni */}
        <div>
          {!sel ? (
            <div style={{padding:'60px 40px',textAlign:'center',border:'1px dashed var(--border)',borderRadius:'var(--r)',color:'var(--muted)',fontSize:14}}>Seleziona un&apos;azienda dalla lista.</div>
          ) : (
            <>
              <div className={t.hdr} style={{marginBottom:16}}>
                <div><h2 style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,letterSpacing:'-.4px'}}>{sel.name}</h2><p style={{fontSize:13,color:'var(--muted)',marginTop:4}}>{asgn.length} corsi assegnati</p></div>
                <button className={t.btnP} onClick={()=>{setForm({accessType:'ACTIVE'});setMsg(null);setShow(true)}} disabled={!available.length}>+ Assegna corso</button>
              </div>
              {loading ? <p>Caricamento...</p> : (
                <div className={t.tableWrap}>
                  <table className={t.table}>
                    <thead><tr><th>Corso</th><th>Software</th><th>Accesso</th><th>Scadenza</th><th></th></tr></thead>
                    <tbody>
                      {asgn.map((a:any)=>(
                        <tr key={a.id}>
                          <td className={t.tdBold}>{a.course?.title}</td>
                          <td>{a.course?.software?.name||'—'}</td>
                          <td>
                            <select style={{padding:'4px 8px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'var(--font-body)',fontWeight:600,color:'var(--ink)',background:'var(--white)',cursor:'pointer',outline:'none'}} value={a.accessType} onChange={e=>changeAccess(a.id,e.target.value)}>
                              <option value="ACTIVE">Attivo</option><option value="LOCKED">Bloccato</option><option value="HIDDEN">Nascosto</option>
                            </select>
                          </td>
                          <td>{a.expiresAt?new Date(a.expiresAt).toLocaleDateString('it-IT'):'∞'}</td>
                          <td><button className={t.btnD} onClick={()=>remove(a.id)}>Rimuovi</button></td>
                        </tr>
                      ))}
                      {!asgn.length && <tr><td colSpan={5} className={t.empty}>Nessun corso assegnato.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {show && (
        <div className={t.overlay}>
          <div className={t.modal}>
            <div className={t.mhdr}><h2>Assegna corso a {sel?.name}</h2><button onClick={()=>setShow(false)}>×</button></div>
            <div className={t.mbody}>
              {msg && <div className={msg.ok?t.ok:t.err}>{msg.t}</div>}
              <label className={t.lbl}>Corso *</label>
              <select className={t.inp} value={form.courseId||''} onChange={e=>setForm({...form,courseId:e.target.value})}>
                <option value="">— seleziona —</option>{available.map(c=><option key={c.id} value={c.id}>{c.title} ({c.software?.name})</option>)}
              </select>
              <label className={t.lbl}>Tipo accesso</label>
              <select className={t.inp} value={form.accessType} onChange={e=>setForm({...form,accessType:e.target.value})}>
                <option value="ACTIVE">Attivo</option><option value="LOCKED">Bloccato (visibile)</option><option value="HIDDEN">Nascosto</option>
              </select>
              <label className={t.lbl}>Scadenza (vuoto = ∞)</label>
              <input className={t.inp} type="date" value={form.expiresAt||''} onChange={e=>setForm({...form,expiresAt:e.target.value||null})}/>
            </div>
            <div className={t.mftr}><button className={t.btnS} onClick={()=>setShow(false)}>Annulla</button><button className={t.btnP} onClick={assign} disabled={saving||!form.courseId}>{saving?'Salvo...':'Assegna'}</button></div>
          </div>
        </div>
      )}
    </main>
  )
}
