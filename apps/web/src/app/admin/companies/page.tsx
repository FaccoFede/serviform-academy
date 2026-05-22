'use client'
import { useState, useEffect, useMemo } from 'react'
import { Pencil, Trash2, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import PageHeader from '../_components/PageHeader'
import styles from '../AdminPage.module.css'
import t from '../table.module.css'

const PAGE_SIZE = 20

export default function AdminCompaniesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [show, setShow] = useState(false)
  const [edit, setEdit] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null)

  const load = async () => {
    setLoading(true)
    try { setRows(await api.companies.findAll()) } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1) }, [q])

  const openNew = () => { setEdit(null); setForm({}); setMsg(null); setShow(true) }
  const openEdit = (r: any) => {
    setEdit(r)
    setForm({ ...r })
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

  const filtered = useMemo(
    () => rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase())),
    [rows, q],
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <main className={styles.main}>
      <PageHeader
        title="Aziende"
        description={`${filtered.length} ${filtered.length === 1 ? 'azienda' : 'aziende'}${q ? ` (filtrate su ${rows.length})` : ''}`}
        action={
          <button className={t.btnP} onClick={openNew}>
            <Plus size={14} />
            Nuova azienda
          </button>
        }
      />

      {msg && (
        <div className={msg.ok ? t.ok : t.err}>
          {msg.t}
          <button onClick={() => setMsg(null)}>×</button>
        </div>
      )}

      <div className={t.searchBar}>
        <input
          className={t.search}
          placeholder="Cerca azienda…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 14, padding: '40px 0' }}>Caricamento…</p>
      ) : (
        <>
          <div className={t.tableWrap}>
            <table className={t.table}>
              <thead>
                <tr>
                  <th>Azienda</th>
                  <th>Utenti</th>
                  <th>Corsi assegnati</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => (
                  <tr key={r.id}>
                    <td className={t.tdBold}>{r.name}</td>
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
                    <td className={t.actionsCell}>
                      <button
                        className={t.iconBtn}
                        title="Modifica"
                        aria-label="Modifica"
                        onClick={() => openEdit(r)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className={t.iconBtn}
                        data-variant="danger"
                        title="Elimina"
                        aria-label="Elimina"
                        onClick={() => del(r.id, r.name)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={4} className={t.empty}>Nessuna azienda trovata.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={t.pagination}>
              <span className={t.paginationInfo}>
                Pagina {currentPage} di {totalPages}
              </span>
              <div className={t.paginationCtrls}>
                <button
                  type="button"
                  className={t.pageBtn}
                  disabled={currentPage === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  aria-label="Pagina precedente"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  className={t.pageBtn}
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  aria-label="Pagina successiva"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

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

              <label className={t.lbl}>Note</label>
              <textarea
                className={t.ta}
                rows={2}
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
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
