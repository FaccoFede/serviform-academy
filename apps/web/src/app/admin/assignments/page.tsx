'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminPage.module.css'
import t from '../table.module.css'

export default function AdminAssignmentsPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [softwareList, setSoftwareList] = useState<any[]>([])
  const [sel, setSel] = useState<any>(null)
  const [asgn, setAsgn] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{t:string;ok:boolean}|null>(null)

  // Bulk modal state
  const [showBulk, setShowBulk] = useState(false)
  const [bulkTab, setBulkTab] = useState<string>('all')
  const [bulkSel, setBulkSel] = useState<Map<string, string>>(new Map())
  const [bulkAccessType, setBulkAccessType] = useState('ACTIVE')

  useEffect(() => {
    Promise.all([api.companies.findAll(), api.courses.findAll(), api.software.findAll()])
      .then(([c, co, sw]) => { setCompanies(c); setCourses(co); setSoftwareList(sw) })
      .catch(() => {})
  }, [])

  const selectCo = async (c: any) => {
    setSel(c); setMsg(null); setLoading(true)
    try { setAsgn(await api.assignments.findByCompany(c.id)) } catch { setAsgn([]) } finally { setLoading(false) }
  }

  const changeAccess = async (id: string, accessType: string) => {
    await api.assignments.updateCompany(id, { accessType })
    setAsgn(await api.assignments.findByCompany(sel.id))
  }

  const remove = async (id: string) => {
    if (!confirm('Rimuovere assegnazione?')) return
    await api.assignments.removeCompany(id)
    setAsgn(await api.assignments.findByCompany(sel.id))
  }

  const assigned = new Set(asgn.map((a: any) => a.courseId))
  const available = courses.filter(c => !assigned.has(c.id))

  // Bulk modal helpers
  const openBulk = () => {
    setBulkSel(new Map())
    setBulkTab('all')
    setBulkAccessType('ACTIVE')
    setMsg(null)
    setShowBulk(true)
  }

  const visibleCourses = available.filter(c =>
    bulkTab === 'all' || c.softwareId === bulkTab
  )

  const toggleBulkCourse = (id: string) => {
    const next = new Map(bulkSel)
    next.has(id) ? next.delete(id) : next.set(id, '')
    setBulkSel(next)
  }

  const setBulkExpiry = (id: string, value: string) => {
    const next = new Map(bulkSel)
    if (next.has(id)) next.set(id, value)
    setBulkSel(next)
  }

  const toggleSelectAll = () => {
    const ids = visibleCourses.map(c => c.id)
    const allSelected = ids.length > 0 && ids.every(id => bulkSel.has(id))
    const next = new Map(bulkSel)
    if (allSelected) {
      ids.forEach(id => next.delete(id))
    } else {
      ids.forEach(id => { if (!next.has(id)) next.set(id, '') })
    }
    setBulkSel(next)
  }

  const bulkAssign = async () => {
    if (!sel || !bulkSel.size) return
    setSaving(true)
    try {
      const courses = [...bulkSel.entries()].map(([courseId, expiresAt]) => ({
        courseId,
        expiresAt: expiresAt || null,
      }))
      await api.assignments.bulkAssignToCompany(sel.id, { courses, accessType: bulkAccessType })
      setShowBulk(false)
      setAsgn(await api.assignments.findByCompany(sel.id))
    } catch (e: any) {
      setMsg({ t: e.message, ok: false })
    } finally {
      setSaving(false)
    }
  }

  const allVisibleSelected = visibleCourses.length > 0 && visibleCourses.every(c => bulkSel.has(c.id))

  return (
    <main className={styles.main}>
      <div className={t.hdr} style={{marginBottom:20}}>
        <div><Link href="/admin" className={t.back}>← Admin</Link><h1 className={styles.title}>Assegnazioni corsi</h1></div>
      </div>
      {msg && !showBulk && <div className={msg.ok ? t.ok : t.err}>{msg.t}<button onClick={() => setMsg(null)}>×</button></div>}
      <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:24,alignItems:'start'}}>
        {/* Sidebar aziende */}
        <div style={{border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden'}}>
          <div style={{padding:'10px 14px',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.7px',color:'var(--muted)',fontFamily:'var(--font-mono)',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>Aziende</div>
          {companies.map(c => (
            <button key={c.id} onClick={() => selectCo(c)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',background:sel?.id===c.id?'var(--red-light)':'none',border:'none',borderBottom:'1px solid var(--border)',cursor:'pointer',textAlign:'left',fontFamily:'var(--font-body)'}}>
              <span style={{fontSize:13.5,fontWeight:700,color:sel?.id===c.id?'var(--red)':'var(--ink)'}}>{c.name}</span>
              <span style={{fontSize:11,fontFamily:'var(--font-mono)',color:'var(--muted)'}}>{c._count?.courseAssignments ?? 0}</span>
            </button>
          ))}
          {!companies.length && <p style={{padding:'16px 14px',fontSize:13,color:'var(--muted)'}}>Nessuna azienda.</p>}
        </div>

        {/* Pannello assegnazioni */}
        <div>
          {!sel ? (
            <div style={{padding:'60px 40px',textAlign:'center',border:'1px dashed var(--border)',borderRadius:'var(--r)',color:'var(--muted)',fontSize:14}}>Seleziona un&apos;azienda dalla lista.</div>
          ) : (
            <>
              <div className={t.hdr} style={{marginBottom:16}}>
                <div>
                  <h2 style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,letterSpacing:'-.4px'}}>{sel.name}</h2>
                  <p style={{fontSize:13,color:'var(--muted)',marginTop:4}}>{asgn.length} corsi assegnati</p>
                </div>
                <button className={t.btnP} onClick={openBulk} disabled={!available.length}>+ Assegna corsi</button>
              </div>
              {loading ? <p>Caricamento...</p> : (
                <div className={t.tableWrap}>
                  <table className={t.table}>
                    <thead><tr><th>Corso</th><th>Categoria</th><th>Accesso</th><th>Scadenza</th><th></th></tr></thead>
                    <tbody>
                      {asgn.map((a: any) => (
                        <tr key={a.id}>
                          <td className={t.tdBold}>{a.course?.title}</td>
                          <td>{a.course?.software?.name || '—'}</td>
                          <td>
                            <select style={{padding:'4px 8px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'var(--font-body)',fontWeight:600,color:'var(--ink)',background:'var(--white)',cursor:'pointer',outline:'none'}} value={a.accessType} onChange={e => changeAccess(a.id, e.target.value)}>
                              <option value="ACTIVE">Attivo</option><option value="LOCKED">Bloccato</option><option value="HIDDEN">Nascosto</option>
                            </select>
                          </td>
                          <td>{a.expiresAt ? new Date(a.expiresAt).toLocaleDateString('it-IT') : '∞'}</td>
                          <td><button className={t.btnD} onClick={() => remove(a.id)}>Rimuovi</button></td>
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

      {/* Modal bulk */}
      {showBulk && (
        <div className={t.overlay}>
          <div className={t.modal} style={{width:'min(720px,95vw)',maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
            <div className={t.mhdr}>
              <h2>Assegna corsi a {sel?.name}</h2>
              <button onClick={() => setShowBulk(false)}>×</button>
            </div>

            <div className={t.mbody} style={{flex:1,overflowY:'auto'}}>
              {msg && <div className={msg.ok ? t.ok : t.err} style={{marginBottom:12}}>{msg.t}<button onClick={() => setMsg(null)}>×</button></div>}

              {/* Filtro categoria (tab bar) */}
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
                <button
                  onClick={() => setBulkTab('all')}
                  style={{padding:'4px 12px',border:'1px solid var(--border)',borderRadius:20,fontSize:12,fontWeight:700,cursor:'pointer',background:bulkTab==='all'?'var(--red)':'var(--white)',color:bulkTab==='all'?'#fff':'var(--ink)',fontFamily:'var(--font-body)'}}
                >
                  Tutti
                </button>
                {softwareList.map(sw => (
                  <button
                    key={sw.id}
                    onClick={() => setBulkTab(sw.id)}
                    style={{padding:'4px 12px',border:'1px solid var(--border)',borderRadius:20,fontSize:12,fontWeight:700,cursor:'pointer',background:bulkTab===sw.id?'var(--red)':'var(--white)',color:bulkTab===sw.id?'#fff':'var(--ink)',fontFamily:'var(--font-body)'}}
                  >
                    {sw.name}
                  </button>
                ))}
              </div>

              {/* Tipo accesso */}
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <label style={{fontSize:13,fontWeight:600,fontFamily:'var(--font-body)',whiteSpace:'nowrap'}}>Tipo accesso:</label>
                <select
                  style={{padding:'5px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:13,fontFamily:'var(--font-body)',background:'var(--white)',cursor:'pointer'}}
                  value={bulkAccessType}
                  onChange={e => setBulkAccessType(e.target.value)}
                >
                  <option value="ACTIVE">Attivo</option>
                  <option value="LOCKED">Bloccato (visibile)</option>
                  <option value="HIDDEN">Nascosto</option>
                </select>
              </div>

              {/* Tabella corsi */}
              <div className={t.tableWrap}>
                <table className={t.table}>
                  <thead>
                    <tr>
                      <th style={{width:36}}>
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAll}
                          disabled={!visibleCourses.length}
                          title={`Seleziona tutti (${visibleCourses.length} disponibili)`}
                        />
                      </th>
                      <th>Corso</th>
                      <th>Categoria</th>
                      <th>Livello</th>
                      <th style={{width:140}}>Scadenza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCourses.map(c => {
                      const selected = bulkSel.has(c.id)
                      const expiry = bulkSel.get(c.id) ?? ''
                      return (
                        <tr key={c.id} style={{opacity: selected ? 1 : 0.6}}>
                          <td>
                            <input type="checkbox" checked={selected} onChange={() => toggleBulkCourse(c.id)} />
                          </td>
                          <td className={t.tdBold}>{c.title}</td>
                          <td>
                            {c.software ? (
                              <span style={{color: c.software.color, fontWeight:600, fontSize:12}}>{c.software.name}</span>
                            ) : '—'}
                          </td>
                          <td style={{fontSize:12,color:'var(--muted)'}}>{c.level || '—'}</td>
                          <td>
                            <input
                              type="date"
                              value={expiry}
                              disabled={!selected}
                              style={{fontSize:12,padding:'3px 6px',border:'1px solid var(--border)',borderRadius:5,fontFamily:'var(--font-body)',opacity: selected ? 1 : 0.35,width:'100%'}}
                              onChange={e => setBulkExpiry(c.id, e.target.value)}
                            />
                          </td>
                        </tr>
                      )
                    })}
                    {!visibleCourses.length && (
                      <tr><td colSpan={5} className={t.empty}>Nessun corso disponibile in questa categoria.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={t.mftr}>
              <button className={t.btnS} onClick={() => setShowBulk(false)}>Annulla</button>
              <button
                className={t.btnP}
                onClick={bulkAssign}
                disabled={saving || !bulkSel.size}
              >
                {saving ? 'Salvo...' : bulkSel.size === 0 ? 'Assegna corsi' : bulkSel.size === 1 ? 'Assegna 1 corso' : `Assegna ${bulkSel.size} corsi`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
