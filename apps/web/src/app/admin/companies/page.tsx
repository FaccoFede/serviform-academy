'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminPage.module.css'
import t from '../table.module.css'

/**
 * Admin Aziende — include il pannello "Preferenze contenuti":
 * l'admin seleziona quali Software (EngView, Sysform, ProjectO, ServiformA…)
 * sono visibili nel portale per i membri dell'azienda.
 *
 * Regole:
 *  • Nessun Software selezionato = nessun filtro → l'azienda vede tutti i corsi.
 *  • La selezione filtra SOLO il catalogo corsi (/courses/portal).
 *  • Comunicazioni (announcements) ed Eventi restano sempre visibili a tutti.
 */
export default function AdminCompaniesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [softwareList, setSoftwareList] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [show, setShow] = useState(false)
  const [edit, setEdit] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null)

  const load = async () => {
    setLoading(true)
    try { setRows(await api.companies.findAll()) } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    api.software.findAll().then(setSoftwareList).catch(() => {})
  }, [])

  const openNew = () => { setEdit(null); setForm({ visibleSoftwareIds: [] }); setMsg(null); setShow(true) }
  const openEdit = (r: any) => {
    setEdit(r)
    setForm({
      ...r,
      assistanceExpiresAt: r.assistanceExpiresAt?.slice(0, 10) || '',
      visibleSoftwareIds: Array.isArray(r.visibleSoftwareIds) ? r.visibleSoftwareIds : [],
    })
    setMsg(null)
    setShow(true)
  }

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      if (edit) {
        await api.companies.update(edit.id, form)
      } else {
        await api.companies.create(form)
      }
      setMsg({ t: edit ? 'Azienda aggiornata.' : 'Azienda creata.', ok: true })
      setShow(false)
      load()
    } catch (e: any) {
      setMsg({ t: e.message || 'Errore salvataggio', ok: false })
    } finally {
      setSaving(false)
    }
  }

  const del = async (id: string, name: string) => {
    if (!confirm(`Eliminare "${name}"?`)) return
    try { await api.companies.remove(id); load() } catch (e: any) { setMsg({ t: e.message, ok: false }) }
  }

  const toggleSoftware = (id: string) => {
    const current: string[] = form.visibleSoftwareIds || []
    setForm({
      ...form,
      visibleSoftwareIds: current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    })
  }

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <main className={styles.main}>
      <div className={t.hdr}>
        <div>
          <Link href="/admin" className={t.back}>← Admin</Link>
          <h1 className={styles.title}>Aziende</h1>
          <p className={styles.desc}>{rows.length} aziende · filtri portale per software</p>
        </div>
        <button className={t.btnP} onClick={openNew}>+ Nuova azienda</button>
      </div>

      {msg && (
        <div className={msg.ok ? t.ok : t.err}>
          {msg.t}
          <button onClick={() => setMsg(null)}>×</button>
        </div>
      )}

      <input
        className={t.search}
        placeholder="Cerca azienda…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 14, padding: '40px 0' }}>Caricamento…</p>
      ) : (
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead>
              <tr>
                <th>Azienda</th>
                <th>Contratto</th>
                <th>Scadenza assist.</th>
                <th>Utenti</th>
                <th>Corsi assegnati</th>
                <th>Portale</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const visible: string[] = Array.isArray(r.visibleSoftwareIds) ? r.visibleSoftwareIds : []
                const expiry = r.assistanceExpiresAt ? new Date(r.assistanceExpiresAt) : null
                const isExpired = expiry && expiry < new Date()
                return (
                  <tr key={r.id}>
                    <td className={t.tdBold}>{r.name}</td>
                    <td>{r.contractType || '—'}</td>
                    <td>
                      {expiry ? (
                        <span style={{ color: isExpired ? 'var(--red)' : 'inherit', fontWeight: isExpired ? 700 : undefined }}>
                          {expiry.toLocaleDateString('it-IT')}
                          {isExpired && ' ⚠'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>∞</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {r._count?.members ?? '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {r._count?.courseAssignments ?? '—'}
                      </span>
                    </td>
                    <td>
                      {visible.length === 0 ? (
                        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                          tutti
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--po)' }}>
                          {visible.length} software
                        </span>
                      )}
                    </td>
                    <td className={t.actions}>
                      <button className={t.btnE} onClick={() => openEdit(r)}>Modifica</button>
                      <button className={t.btnD} onClick={() => del(r.id, r.name)}>Elimina</button>
                    </td>
                  </tr>
                )
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={7} className={t.empty}>Nessuna azienda trovata.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal creazione / modifica */}
      {show && (
        <div className={t.overlay}>
          <div className={t.modal} style={{ maxWidth: 600 }}>
            <div className={t.mhdr}>
              <h2>{edit ? 'Modifica' : 'Nuova'} azienda</h2>
              <button type="button" onClick={() => setShow(false)}>×</button>
            </div>

            <div className={t.mbody}>
              {msg && !msg.ok && <div className={t.err}>{msg.t}<button onClick={() => setMsg(null)}>×</button></div>}

              <label className={t.lbl}>Ragione sociale *</label>
              <input
                className={t.inp}
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Es. Rossi S.r.l."
              />

              <label className={t.lbl}>Slug * {edit && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(non modificabile)</span>}</label>
              <input
                className={t.inp}
                value={form.slug || ''}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                disabled={!!edit}
                placeholder="rossi-srl"
              />

              <label className={t.lbl}>Tipo contratto</label>
              <select
                className={t.inp}
                value={form.contractType || ''}
                onChange={(e) => setForm({ ...form, contractType: e.target.value })}
              >
                <option value="">—</option>
                {['Standard', 'Enterprise', 'Trial', 'Personalizzato'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>

              <label className={t.lbl}>Scadenza assistenza</label>
              <input
                className={t.inp}
                type="date"
                value={form.assistanceExpiresAt || ''}
                onChange={(e) => setForm({ ...form, assistanceExpiresAt: e.target.value || null })}
              />

              <label className={t.lbl}>Note</label>
              <textarea
                className={t.ta}
                rows={2}
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />

              {/* Preferenze software visibili nel portale */}
              {softwareList.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <label className={t.lbl}>Software visibili nel portale</label>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, marginBottom: 10, lineHeight: 1.5 }}>
                    Nessuna selezione = l'azienda vede tutti i corsi disponibili.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {softwareList.map((sw: any) => {
                      const selected = (form.visibleSoftwareIds || []).includes(sw.id)
                      return (
                        <button
                          key={sw.id}
                          type="button"
                          onClick={() => toggleSoftware(sw.id)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 7,
                            border: `1.5px solid ${selected ? (sw.color || 'var(--ink)') : 'var(--border)'}`,
                            background: selected ? (sw.lightColor || 'var(--surface)') : 'var(--white)',
                            color: selected ? (sw.color || 'var(--ink)') : 'var(--muted)',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                            transition: 'all var(--t-color)',
                          }}
                        >
                          {sw.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className={t.mftr}>
              <button className={t.btnS} type="button" onClick={() => setShow(false)}>Annulla</button>
              <button className={t.btnP} type="button" onClick={save} disabled={saving}>
                {saving ? 'Salvataggio…' : (edit ? 'Aggiorna' : 'Crea azienda')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
