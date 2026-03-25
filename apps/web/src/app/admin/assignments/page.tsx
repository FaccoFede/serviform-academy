'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../AdminPage.module.css'
import tableStyles from '../companies/CompaniesAdmin.module.css'
import assignStyles from './AssignmentsAdmin.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function authHeaders() {
  const token = localStorage.getItem('sa_token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }
}

const ACCESS_LABELS: Record<string, string> = {
  ACTIVE: 'Attivo',
  LOCKED: 'Bloccato',
  HIDDEN: 'Nascosto',
}

export default function AdminAssignmentsPage() {
  const [tab, setTab] = useState<'company' | 'user'>('company')
  const [companies, setCompanies] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({ accessType: 'ACTIVE' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    async function loadBase() {
      try {
        const [cRes, coRes] = await Promise.all([
          fetch(API_URL + '/companies', { headers: authHeaders() }),
          fetch(API_URL + '/courses', { headers: authHeaders() }),
        ])
        if (cRes.ok) setCompanies(await cRes.json())
        if (coRes.ok) setCourses(await coRes.json())
      } catch { /* ignore */ }
    }
    loadBase()
  }, [])

  async function loadAssignments(companyId: string) {
    setLoading(true)
    try {
      const res = await fetch(API_URL + '/assignments/company/' + companyId, { headers: authHeaders() })
      if (res.ok) setAssignments(await res.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  function selectCompany(c: any) {
    setSelectedCompany(c)
    loadAssignments(c.id)
    setMsg(null)
  }

  async function handleAssign() {
    if (!selectedCompany || !form.courseId) return
    setSaving(true)
    try {
      const res = await fetch(
        `${API_URL}/assignments/company/${selectedCompany.id}/course/${form.courseId}`,
        { method: 'POST', headers: authHeaders(), body: JSON.stringify(form) }
      )
      if (!res.ok) throw new Error((await res.json()).message || 'Errore')
      setMsg({ text: 'Corso assegnato.', type: 'success' })
      setShowForm(false)
      loadAssignments(selectedCompany.id)
    } catch (e: any) {
      setMsg({ text: e.message, type: 'error' })
    } finally { setSaving(false) }
  }

  async function handleRemove(id: string) {
    if (!confirm('Rimuovere questa assegnazione?')) return
    try {
      await fetch(API_URL + '/assignments/company/' + id, { method: 'DELETE', headers: authHeaders() })
      loadAssignments(selectedCompany.id)
    } catch { /* ignore */ }
  }

  async function handleUpdateAccess(id: string, accessType: string) {
    try {
      await fetch(API_URL + '/assignments/company/' + id, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ accessType }),
      })
      loadAssignments(selectedCompany.id)
    } catch { /* ignore */ }
  }

  // Corsi non ancora assegnati a questa azienda
  const assignedCourseIds = new Set(assignments.map(a => a.courseId))
  const availableCourses = courses.filter(c => !assignedCourseIds.has(c.id))

  return (
    <main className={styles.main}>
      <div className={tableStyles.pageHeader}>
        <div>
          <Link href="/admin" className={tableStyles.back}>← Admin</Link>
          <h1 className={styles.title}>Assegnazioni</h1>
          <p className={styles.desc}>Gestisci accesso ai corsi per azienda e utente</p>
        </div>
      </div>

      {msg && (
        <div className={`${tableStyles.msg} ${msg.type === 'error' ? tableStyles.msgError : tableStyles.msgSuccess}`}>
          {msg.text}
          <button onClick={() => setMsg(null)}>×</button>
        </div>
      )}

      <div className={assignStyles.layout}>
        {/* Lista aziende */}
        <div className={assignStyles.sidebar}>
          <div className={assignStyles.sidebarTitle}>Aziende</div>
          {companies.map(c => (
            <button
              key={c.id}
              className={[assignStyles.companyBtn, selectedCompany?.id === c.id ? assignStyles.companyBtnActive : ''].join(' ')}
              onClick={() => selectCompany(c)}
            >
              <span className={assignStyles.companyName}>{c.name}</span>
              <span className={assignStyles.companyCount}>{c._count?.courseAssignments ?? 0} corsi</span>
            </button>
          ))}
          {companies.length === 0 && (
            <p className={assignStyles.empty}>Nessuna azienda. <Link href="/admin/companies">Crea prima un'azienda</Link>.</p>
          )}
        </div>

        {/* Assegnazioni */}
        <div className={assignStyles.content}>
          {!selectedCompany ? (
            <div className={assignStyles.placeholder}>
              <p>Seleziona un'azienda dalla lista per gestire le assegnazioni.</p>
            </div>
          ) : (
            <>
              <div className={assignStyles.contentHeader}>
                <div>
                  <h2 className={assignStyles.contentTitle}>{selectedCompany.name}</h2>
                  <p className={assignStyles.contentSub}>{assignments.length} corsi assegnati</p>
                </div>
                <button
                  className={tableStyles.btnPrimary}
                  onClick={() => { setForm({ accessType: 'ACTIVE' }); setShowForm(true); setMsg(null) }}
                  disabled={availableCourses.length === 0}
                >
                  + Assegna corso
                </button>
              </div>

              {loading ? (
                <p className={tableStyles.loading}>Caricamento...</p>
              ) : (
                <div className={tableStyles.tableWrap}>
                  <table className={tableStyles.table}>
                    <thead>
                      <tr>
                        <th>Corso</th>
                        <th>Software</th>
                        <th>Accesso</th>
                        <th>Scadenza</th>
                        <th>Assegnato il</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map(a => (
                        <tr key={a.id}>
                          <td className={tableStyles.tdName}>{a.course?.title}</td>
                          <td>{a.course?.software?.name || '—'}</td>
                          <td>
                            <select
                              className={assignStyles.accessSelect}
                              value={a.accessType}
                              onChange={e => handleUpdateAccess(a.id, e.target.value)}
                            >
                              <option value="ACTIVE">Attivo</option>
                              <option value="LOCKED">Bloccato</option>
                              <option value="HIDDEN">Nascosto</option>
                            </select>
                          </td>
                          <td>
                            {a.expiresAt
                              ? new Date(a.expiresAt).toLocaleDateString('it-IT')
                              : <span className={tableStyles.infinity}>∞</span>}
                          </td>
                          <td>{new Date(a.createdAt).toLocaleDateString('it-IT')}</td>
                          <td className={tableStyles.actions}>
                            <button className={tableStyles.btnDelete} onClick={() => handleRemove(a.id)}>Rimuovi</button>
                          </td>
                        </tr>
                      ))}
                      {assignments.length === 0 && (
                        <tr><td colSpan={6} className={tableStyles.empty}>Nessun corso assegnato a questa azienda.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Form assegnazione */}
      {showForm && (
        <div className={tableStyles.overlay}>
          <div className={tableStyles.modal}>
            <div className={tableStyles.modalHeader}>
              <h2>Assegna corso a {selectedCompany?.name}</h2>
              <button className={tableStyles.modalClose} onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className={tableStyles.modalBody}>
              {msg && (
                <div className={`${tableStyles.msg} ${msg.type === 'error' ? tableStyles.msgError : tableStyles.msgSuccess}`}>
                  {msg.text}
                </div>
              )}

              <label className={tableStyles.label}>Corso *</label>
              <select className={tableStyles.input} value={form.courseId || ''} onChange={e => setForm({ ...form, courseId: e.target.value })}>
                <option value="">— seleziona corso —</option>
                {availableCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.software?.name})</option>
                ))}
              </select>

              <label className={tableStyles.label}>Tipo accesso</label>
              <select className={tableStyles.input} value={form.accessType} onChange={e => setForm({ ...form, accessType: e.target.value })}>
                <option value="ACTIVE">Attivo — fruibile</option>
                <option value="LOCKED">Bloccato — visibile ma non fruibile</option>
                <option value="HIDDEN">Nascosto — non visibile</option>
              </select>

              <label className={tableStyles.label}>Data inizio</label>
              <input className={tableStyles.input} type="date" value={form.startsAt || ''} onChange={e => setForm({ ...form, startsAt: e.target.value })} />

              <label className={tableStyles.label}>Data scadenza (vuoto = illimitata ∞)</label>
              <input className={tableStyles.input} type="date" value={form.expiresAt || ''} onChange={e => setForm({ ...form, expiresAt: e.target.value || null })} />

              <label className={tableStyles.label}>Note interne</label>
              <textarea className={tableStyles.textarea} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div className={tableStyles.modalFooter}>
              <button className={tableStyles.btnSecondary} onClick={() => setShowForm(false)}>Annulla</button>
              <button className={tableStyles.btnPrimary} onClick={handleAssign} disabled={saving || !form.courseId}>
                {saving ? 'Salvataggio...' : 'Assegna'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
