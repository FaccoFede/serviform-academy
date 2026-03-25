'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminPage.module.css'
import t from '../companies/Companies.module.css'
import s from './Assignments.module.css'

export default function AdminAssignmentsPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({ accessType: 'ACTIVE' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null)

  useEffect(() => {
    Promise.all([api.companies.findAll(), api.courses.findAll()])
      .then(([c, co]) => { setCompanies(c); setCourses(co) })
      .catch(() => {})
  }, [])

  async function selectCompany(c: any) {
    setSelectedCompany(c); setMsg(null); setLoading(true)
    try { setAssignments(await api.assignments.findByCompany(c.id)) } catch { setAssignments([]) } finally { setLoading(false) }
  }

  async function handleAssign() {
    if (!selectedCompany || !form.courseId) return
    setSaving(true)
    try {
      await api.assignments.assignToCompany(selectedCompany.id, form.courseId, form)
      setMsg({ text: 'Corso assegnato.', type: 'ok' }); setShowForm(false)
      setAssignments(await api.assignments.findByCompany(selectedCompany.id))
    } catch (e: any) { setMsg({ text: e.message, type: 'err' }) }
    finally { setSaving(false) }
  }

  async function handleUpdateAccess(id: string, accessType: string) {
    try {
      await api.assignments.updateCompany(id, { accessType })
      setAssignments(await api.assignments.findByCompany(selectedCompany.id))
    } catch { /* ignore */ }
  }

  async function handleRemove(id: string) {
    if (!confirm('Rimuovere questa assegnazione?')) return
    try {
      await api.assignments.removeCompany(id)
      setAssignments(await api.assignments.findByCompany(selectedCompany.id))
    } catch { /* ignore */ }
  }

  const assignedIds = new Set(assignments.map((a: any) => a.courseId))
  const available = courses.filter(c => !assignedIds.has(c.id))

  return (
    <main className={styles.main}>
      <div className={t.hdr} style={{ marginBottom: 28 }}>
        <div>
          <Link href="/admin" className={t.back}>← Admin</Link>
          <h1 className={styles.title}>Assegnazioni</h1>
          <p className={styles.desc}>Gestisci accesso ai corsi per azienda</p>
        </div>
      </div>

      {msg && <div className={`${t.msg} ${msg.type === 'err' ? t.msgErr : t.msgOk}`}>{msg.text} <button onClick={() => setMsg(null)}>×</button></div>}

      <div className={s.layout}>
        {/* Lista aziende */}
        <div className={s.sidebar}>
          <div className={s.sidebarTitle}>Aziende</div>
          {companies.map(c => (
            <button key={c.id} className={[s.compBtn, selectedCompany?.id === c.id ? s.compBtnActive : ''].join(' ')} onClick={() => selectCompany(c)}>
              <span className={s.compName}>{c.name}</span>
              <span className={s.compCount}>{c._count?.courseAssignments ?? 0} corsi</span>
            </button>
          ))}
          {companies.length === 0 && <p className={s.empty}>Nessuna azienda. <Link href="/admin/companies">Creane una</Link>.</p>}
        </div>

        {/* Assegnazioni */}
        <div className={s.content}>
          {!selectedCompany ? (
            <div className={s.placeholder}>Seleziona un'azienda dalla lista.</div>
          ) : (
            <>
              <div className={t.hdr} style={{ marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>{selectedCompany.name}</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{assignments.length} corsi assegnati</p>
                </div>
                <button className={t.btnPrimary} onClick={() => { setForm({ accessType: 'ACTIVE' }); setShowForm(true); setMsg(null) }} disabled={available.length === 0}>
                  + Assegna corso
                </button>
              </div>

              {loading ? <p className={t.loading}>Caricamento...</p> : (
                <div className={t.tableWrap}>
                  <table className={t.table}>
                    <thead><tr><th>Corso</th><th>Software</th><th>Accesso</th><th>Scadenza</th><th>Assegnato il</th><th></th></tr></thead>
                    <tbody>
                      {assignments.map((a: any) => (
                        <tr key={a.id}>
                          <td className={t.tdBold}>{a.course?.title}</td>
                          <td>{a.course?.software?.name || '—'}</td>
                          <td>
                            <select className={s.accessSelect} value={a.accessType} onChange={e => handleUpdateAccess(a.id, e.target.value)}>
                              <option value="ACTIVE">Attivo</option>
                              <option value="LOCKED">Bloccato</option>
                              <option value="HIDDEN">Nascosto</option>
                            </select>
                          </td>
                          <td>{a.expiresAt ? new Date(a.expiresAt).toLocaleDateString('it-IT') : <span className={t.inf}>∞</span>}</td>
                          <td>{new Date(a.createdAt).toLocaleDateString('it-IT')}</td>
                          <td><button className={t.btnDel} onClick={() => handleRemove(a.id)}>Rimuovi</button></td>
                        </tr>
                      ))}
                      {assignments.length === 0 && <tr><td colSpan={6} className={t.empty}>Nessun corso assegnato a questa azienda.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showForm && (
        <div className={t.overlay}>
          <div className={t.modal}>
            <div className={t.modalHdr}><h2>Assegna corso a {selectedCompany?.name}</h2><button onClick={() => setShowForm(false)}>×</button></div>
            <div className={t.modalBody}>
              {msg && <div className={`${t.msg} ${msg.type === 'err' ? t.msgErr : t.msgOk}`}>{msg.text}</div>}
              <label className={t.label}>Corso *</label>
              <select className={t.input} value={form.courseId || ''} onChange={e => setForm({ ...form, courseId: e.target.value })}>
                <option value="">— seleziona —</option>
                {available.map(c => <option key={c.id} value={c.id}>{c.title} ({c.software?.name})</option>)}
              </select>
              <label className={t.label}>Tipo accesso</label>
              <select className={t.input} value={form.accessType} onChange={e => setForm({ ...form, accessType: e.target.value })}>
                <option value="ACTIVE">Attivo — fruibile</option>
                <option value="LOCKED">Bloccato — visibile ma non fruibile</option>
                <option value="HIDDEN">Nascosto — non visibile</option>
              </select>
              <label className={t.label}>Data inizio</label>
              <input className={t.input} type="date" value={form.startsAt || ''} onChange={e => setForm({ ...form, startsAt: e.target.value })} />
              <label className={t.label}>Scadenza (vuoto = ∞)</label>
              <input className={t.input} type="date" value={form.expiresAt || ''} onChange={e => setForm({ ...form, expiresAt: e.target.value || null })} />
              <label className={t.label}>Note</label>
              <textarea className={t.textarea} rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className={t.modalFtr}>
              <button className={t.btnSec} onClick={() => setShowForm(false)}>Annulla</button>
              <button className={t.btnPrimary} onClick={handleAssign} disabled={saving || !form.courseId}>{saving ? 'Salvataggio...' : 'Assegna'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
