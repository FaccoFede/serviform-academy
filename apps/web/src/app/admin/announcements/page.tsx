'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import styles from '../AdminPage.module.css'
import t from '../table.module.css'

// ── Dati statici ──────────────────────────────────────────────────────────
const ANN_SECTIONS = [
  { v: 'COMUNICAZIONE', l: 'Comunicazione' },
]

const ANN_TYPE_LABELS: Record<string, string> = {
  COMUNICAZIONE: 'Comunicazione', NEW_COURSE: 'Nuovo corso', WEBINAR: 'Webinar',
  MAINTENANCE: 'Manutenzione', WORKSHOP: 'Workshop', EVENTO: 'Evento',
}

const EVENT_TYPES = [
  { v: 'WEBINAR',      l: 'Webinar' },
  { v: 'WORKSHOP',     l: 'Workshop' },
  { v: 'LIVE_SESSION', l: 'Sessione live' },
  { v: 'EVENTO',       l: 'Evento' },
]

function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
}

// Converte una stringa UTC ISO in formato YYYY-MM-DDTHH:mm locale (per datetime-local)
function toLocalDatetime(iso: string): string {
  const d = new Date(iso)
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

// ── Tipi form ─────────────────────────────────────────────────────────────
type Tab = 'announcements' | 'events'

const ANN_EMPTY = { title: '', body: '', section: 'COMUNICAZIONE', bannerUrl: '', content: '', expiresAt: '' }
const EV_EMPTY  = { title: '', description: '', eventType: 'WEBINAR', date: '', endDate: '', location: '', bannerUrl: '', content: '', maxSeats: '' }

// ─────────────────────────────────────────────────────────────────────────
export default function AdminNewsroomPage() {
  const { token } = useAuth()
  const [tab, setTab] = useState<Tab>('announcements')

  // ── Stato comunicazioni ──────────────────────────────────────────────
  const [annRows,    setAnnRows]    = useState<any[]>([])
  const [annLoading, setAnnLoading] = useState(true)
  const [showAnn,    setShowAnn]    = useState(false)
  const [editAnn,    setEditAnn]    = useState<any>(null)
  const [formAnn,    setFormAnn]    = useState<any>(ANN_EMPTY)

  // ── Stato eventi ─────────────────────────────────────────────────────
  const [evRows,    setEvRows]    = useState<any[]>([])
  const [evLoading, setEvLoading] = useState(true)
  const [showEv,    setShowEv]    = useState(false)
  const [editEv,    setEditEv]    = useState<any>(null)
  const [formEv,    setFormEv]    = useState<any>(EV_EMPTY)

  // ── Stato condiviso ───────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null)

  // ── Fetch ─────────────────────────────────────────────────────────────
  const loadAnn = async () => {
    setAnnLoading(true)
    try { setAnnRows(await api.announcements.findAll()) } catch {}
    finally { setAnnLoading(false) }
  }
  const loadEv = async () => {
    setEvLoading(true)
    try { setEvRows(await api.events.findAllAdmin()) } catch {}
    finally { setEvLoading(false) }
  }

  useEffect(() => { loadAnn(); loadEv() }, [])

  // ── Handlers comunicazioni ─────────────────────────────────────────────
  const openNewAnn = () => {
    setEditAnn(null); setFormAnn(ANN_EMPTY); setMsg(null); setShowAnn(true)
  }
  const openEditAnn = (r: any) => {
    setEditAnn(r)
    setFormAnn({
      title: r.title, body: r.body || '', section: r.section || 'COMUNICAZIONE',
      bannerUrl: r.bannerUrl || '', content: r.content || '',
      expiresAt: r.expiresAt ? toLocalDatetime(r.expiresAt) : '',
    })
    setMsg(null); setShowAnn(true)
  }
  const handleSaveAnn = async (publish: boolean) => {
    if (!formAnn.title?.trim()) { setMsg({ t: 'Il titolo è obbligatorio.', ok: false }); return }
    setSaving(true)
    try {
      const payload = {
        ...formAnn,
        publish,
        expiresAt: formAnn.expiresAt ? new Date(formAnn.expiresAt).toISOString() : '',
      }
      if (editAnn) await api.announcements.update(editAnn.id, payload)
      else await api.announcements.create(payload)
      setMsg({ t: editAnn ? 'Aggiornato.' : 'Creato.', ok: true })
      setShowAnn(false); loadAnn()
    } catch (e: any) { setMsg({ t: e.message, ok: false }) }
    finally { setSaving(false) }
  }
  const delAnn = async (id: string) => {
    if (!confirm('Eliminare questa comunicazione?')) return
    try { await api.announcements.remove(id); loadAnn() }
    catch (e: any) { setMsg({ t: e.message, ok: false }) }
  }


  // ── Handlers eventi ────────────────────────────────────────────────────
  const openNewEv = () => {
    setEditEv(null); setFormEv(EV_EMPTY); setMsg(null); setShowEv(true)
  }
  const openEditEv = (r: any) => {
    setEditEv(r)
    setFormEv({
      title: r.title, description: r.description || '',
      eventType: r.eventType || 'WEBINAR',
      date: r.date ? toLocalDatetime(r.date) : '',
      endDate: r.endDate ? toLocalDatetime(r.endDate) : '',
      location: r.location || '', bannerUrl: r.bannerUrl || '',
      content: r.content || '', maxSeats: r.maxSeats ?? '',
    })
    setMsg(null); setShowEv(true)
  }
  const saveEv = async () => {
    if (!formEv.title?.trim()) { setMsg({ t: 'Il titolo è obbligatorio.', ok: false }); return }
    if (!formEv.date)          { setMsg({ t: 'La data è obbligatoria.', ok: false }); return }
    setSaving(true)
    try {
      const payload = {
        ...formEv,
        published: !!formEv.published,
        date: formEv.date ? new Date(formEv.date).toISOString() : '',
        endDate: formEv.endDate ? new Date(formEv.endDate).toISOString() : '',
      }
      if (editEv) await api.events.update(editEv.id, payload)
      else await api.events.create(payload)
      setMsg({ t: editEv ? 'Aggiornato.' : 'Creato.', ok: true })
      setShowEv(false); loadEv()
    } catch (e: any) { setMsg({ t: e.message, ok: false }) }
    finally { setSaving(false) }
  }
  const delEv = async (id: string) => {
    if (!confirm('Eliminare questo evento?')) return
    try { await api.events.remove(id); loadEv() }
    catch (e: any) { setMsg({ t: e.message, ok: false }) }
  }
  const togglePublishEv = async (r: any) => { await api.events.update(r.id, { published: !r.published }); loadEv() }

  const isLoading = tab === 'announcements' ? annLoading : evLoading

  return (
    <main className={styles.main}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className={t.hdr}>
        <div>
          <Link href="/admin" className={t.back}>← Admin</Link>
          <h1 className={styles.title}>Comunicazione &amp; Eventi</h1>
          <p className={styles.desc}>
            {tab === 'announcements'
              ? `${annRows.length} comunicazioni`
              : `${evRows.length} eventi`}
          </p>
        </div>
        <button
          className={t.btnP}
          onClick={tab === 'announcements' ? openNewAnn : openNewEv}
        >
          + {tab === 'announcements' ? 'Nuova comunicazione' : 'Nuovo evento'}
        </button>
      </div>

      {/* ── Messaggi ────────────────────────────────────────────────── */}
      {msg && (
        <div className={msg.ok ? t.ok : t.err}>
          {msg.t}
          <button onClick={() => setMsg(null)}>×</button>
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {(['announcements', 'events'] as Tab[]).map(k => (
          <button
            key={k}
            onClick={() => { setTab(k); setMsg(null) }}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: tab === k ? 'var(--ink)' : 'var(--muted)',
              borderBottom: tab === k ? '2px solid var(--red)' : '2px solid transparent',
              marginBottom: -2,
              transition: 'color 150ms',
            }}
          >
            {k === 'announcements' ? 'Comunicazioni' : 'Eventi'}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB — COMUNICAZIONI
         ══════════════════════════════════════════════════════════════ */}
      {tab === 'announcements' && (
        annLoading ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Caricamento...</p>
        ) : (
          <div className={t.tableWrap}>
            <table className={t.table}>
              <thead>
                <tr>
                  <th>Titolo</th>
                  <th>Sezione</th>
                  <th>Stato</th>
                  <th>Banner</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {annRows.map(r => (
                  <tr key={r.id}>
                    <td className={t.tdBold}>{r.title}</td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--surface)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {ANN_SECTIONS.find(s => s.v === r.section)?.l || r.section || 'COMUNICAZIONE'}
                      </span>
                    </td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 6, display: 'inline-block', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', background: r.published ? '#ECFDF5' : 'var(--surface)', color: r.published ? '#059669' : 'var(--muted)' }}>
                        {r.published ? '● Pubblicata' : '○ Bozza'}
                      </span>
                    </td>
                    <td>
                      {r.bannerUrl
                        ? <span style={{ color: '#059669', fontSize: 12, fontWeight: 700 }}>✓ Sì</span>
                        : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td className={t.actions}>
                      <button className={t.btnE} onClick={() => openEditAnn(r)}>Modifica</button>
                      <button className={t.btnD} onClick={() => delAnn(r.id)}>Elimina</button>
                    </td>
                  </tr>
                ))}
                {!annRows.length && (
                  <tr><td colSpan={5} className={t.empty}>Nessuna comunicazione.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB — EVENTI
         ══════════════════════════════════════════════════════════════ */}
      {tab === 'events' && (
        evLoading ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Caricamento...</p>
        ) : (
          <div className={t.tableWrap}>
            <table className={t.table}>
              <thead>
                <tr>
                  <th>Titolo</th>
                  <th>Tipo</th>
                  <th>Data</th>
                  <th>Luogo</th>
                  <th>Stato</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {evRows.map(r => (
                  <tr key={r.id}>
                    <td className={t.tdBold}>{r.title}</td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: '#ECFDF5', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#059669' }}>
                        {EVENT_TYPES.find(e => e.v === r.eventType)?.l || r.eventType}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                      {fmtDate(r.date)}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{r.location || '—'}</td>
                    <td>
                      <button
                        onClick={() => togglePublishEv(r)}
                        style={{ padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', background: r.published ? '#ECFDF5' : 'var(--surface)', color: r.published ? '#059669' : 'var(--muted)' }}
                      >
                        {r.published ? '● Pubbl.' : '○ Bozza'}
                      </button>
                    </td>
                    <td className={t.actions}>
                      <button className={t.btnE} onClick={() => openEditEv(r)}>Modifica</button>
                      <button className={t.btnD} onClick={() => delEv(r.id)}>Elimina</button>
                    </td>
                  </tr>
                ))}
                {!evRows.length && (
                  <tr><td colSpan={6} className={t.empty}>Nessun evento.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL — COMUNICAZIONE
         ══════════════════════════════════════════════════════════════ */}
      {showAnn && (
        <div className={t.overlay}>
          <div className={t.modal} style={{ maxWidth: 640 }}>
            <div className={t.mhdr}>
              <h2>{editAnn ? 'Modifica' : 'Nuova'} comunicazione</h2>
              <button onClick={() => setShowAnn(false)}>×</button>
            </div>
            <div className={t.mbody}>
              {msg && <div className={msg.ok ? t.ok : t.err}>{msg.t}</div>}

              <label className={t.lbl}>Titolo *</label>
              <input
                className={t.inp}
                value={formAnn.title || ''}
                onChange={e => setFormAnn({ ...formAnn, title: e.target.value })}
                placeholder="Titolo comunicazione..."
              />

              <label className={t.lbl}>Testo breve (estratto visibile in lista)</label>
              <textarea
                className={t.ta}
                rows={2}
                value={formAnn.body || ''}
                onChange={e => setFormAnn({ ...formAnn, body: e.target.value })}
                placeholder="Breve descrizione mostrata nelle card..."
              />

              <label className={t.lbl}>Sezione</label>
              <select
                className={t.inp}
                value={formAnn.section}
                onChange={e => setFormAnn({ ...formAnn, section: e.target.value })}
              >
                {ANN_SECTIONS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>

              <label className={t.lbl}>
                Banner / Copertina
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 8, fontWeight: 400 }}>
                  1200×400 px consigliati · JPEG, PNG o WebP · max 2 MB
                </span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingBanner}
                className={t.inp}
                style={{ padding: '6px 8px', cursor: 'pointer' }}
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file || !token) return
                  setUploadingBanner(true)
                  try {
                    const { url } = await api.uploads.banner(file, token)
                    setFormAnn((f: any) => ({ ...f, bannerUrl: url }))
                  } catch (err: any) {
                    setMsg({ t: err.message || 'Errore upload banner', ok: false })
                  } finally {
                    setUploadingBanner(false)
                    e.target.value = ''
                  }
                }}
              />
              {uploadingBanner && (
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Caricamento in corso...</p>
              )}
              {formAnn.bannerUrl && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={formAnn.bannerUrl}
                    alt="Preview banner"
                    style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormAnn((f: any) => ({ ...f, bannerUrl: '' }))}
                    style={{ marginTop: 4, fontSize: 12, color: '#E63329', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}
                  >
                    Rimuovi banner
                  </button>
                </div>
              )}

              <label className={t.lbl}>Contenuto articolo (HTML)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <textarea
                  value={formAnn.content || ''}
                  onChange={e => setFormAnn({ ...formAnn, content: e.target.value })}
                  placeholder={'<h3>Titolo</h3>\n<p>Testo...</p>'}
                  style={{ minHeight: 160, padding: 10, border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5, outline: 'none', resize: 'vertical' }}
                />
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', overflow: 'auto', background: 'var(--surface)', minHeight: 160, fontSize: 13, lineHeight: 1.7 }}>
                  {formAnn.content
                    ? <div dangerouslySetInnerHTML={{ __html: formAnn.content }} style={{ color: 'var(--muted-dark)' }}/>
                    : <span style={{ color: 'var(--muted)', fontSize: 12 }}>Anteprima...</span>}
                </div>
              </div>

              <label className={t.lbl}>
                Data e ora di scadenza primo piano
                <small style={{ display: 'block', color: 'var(--muted)', fontWeight: 400, marginTop: 2 }}>
                  Lascia vuoto per non mettere in primo piano. Se compilato, la comunicazione appare in primo piano fino a questa data e ora.
                </small>
              </label>
              <input
                className={t.inp}
                type="datetime-local"
                value={formAnn.expiresAt || ''}
                onChange={e => setFormAnn({ ...formAnn, expiresAt: e.target.value || '' })}
              />
            </div>
            <div className={t.mftr}>
              <button className={t.btnS} onClick={() => setShowAnn(false)}>Annulla</button>
              <button className={t.btnS} onClick={() => handleSaveAnn(false)} disabled={saving} style={{ marginLeft: 'auto' }}>
                {saving ? 'Salvo...' : 'Salva bozza'}
              </button>
              <button className={t.btnP} onClick={() => handleSaveAnn(true)} disabled={saving}>
                {saving ? 'Salvo...' : 'Pubblica'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL — EVENTO
         ══════════════════════════════════════════════════════════════ */}
      {showEv && (
        <div className={t.overlay}>
          <div className={t.modal} style={{ maxWidth: 600 }}>
            <div className={t.mhdr}>
              <h2>{editEv ? 'Modifica' : 'Nuovo'} evento</h2>
              <button onClick={() => setShowEv(false)}>×</button>
            </div>
            <div className={t.mbody}>
              {msg && <div className={msg.ok ? t.ok : t.err}>{msg.t}</div>}

              <label className={t.lbl}>Titolo *</label>
              <input
                className={t.inp}
                value={formEv.title || ''}
                onChange={e => setFormEv({ ...formEv, title: e.target.value })}
                placeholder="Titolo evento..."
              />

              <label className={t.lbl}>Descrizione</label>
              <textarea
                className={t.ta}
                rows={3}
                value={formEv.description || ''}
                onChange={e => setFormEv({ ...formEv, description: e.target.value })}
                placeholder="Descrizione dell'evento..."
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className={t.lbl}>Tipo *</label>
                  <select
                    className={t.inp}
                    value={formEv.eventType}
                    onChange={e => setFormEv({ ...formEv, eventType: e.target.value })}
                  >
                    {EVENT_TYPES.map(et => <option key={et.v} value={et.v}>{et.l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={t.lbl}>Posti massimi</label>
                  <input
                    className={t.inp}
                    type="number"
                    value={formEv.maxSeats || ''}
                    onChange={e => setFormEv({ ...formEv, maxSeats: e.target.value })}
                    placeholder="es. 50"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className={t.lbl}>Data inizio * (es. 2026-06-15T09:00)</label>
                  <input
                    className={t.inp}
                    type="datetime-local"
                    value={formEv.date || ''}
                    onChange={e => setFormEv({ ...formEv, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className={t.lbl}>Data fine (opzionale)</label>
                  <input
                    className={t.inp}
                    type="datetime-local"
                    value={formEv.endDate || ''}
                    onChange={e => setFormEv({ ...formEv, endDate: e.target.value })}
                  />
                </div>
              </div>

              <label className={t.lbl}>Luogo</label>
              <input
                className={t.inp}
                value={formEv.location || ''}
                onChange={e => setFormEv({ ...formEv, location: e.target.value })}
                placeholder="Online (Zoom), Milano..."
              />

              <label className={t.lbl}>
                Banner / Copertina
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 8, fontWeight: 400 }}>
                  1200×400 px consigliati · JPEG, PNG o WebP · max 2 MB
                </span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingBanner}
                className={t.inp}
                style={{ padding: '6px 8px', cursor: 'pointer' }}
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file || !token) return
                  setUploadingBanner(true)
                  try {
                    const { url } = await api.uploads.banner(file, token)
                    setFormEv((f: any) => ({ ...f, bannerUrl: url }))
                  } catch (err: any) {
                    setMsg({ t: err.message || 'Errore upload banner', ok: false })
                  } finally {
                    setUploadingBanner(false)
                    e.target.value = ''
                  }
                }}
              />
              {uploadingBanner && (
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Caricamento in corso...</p>
              )}
              {formEv.bannerUrl && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={formEv.bannerUrl}
                    alt="Preview banner"
                    style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormEv((f: any) => ({ ...f, bannerUrl: '' }))}
                    style={{ marginTop: 4, fontSize: 12, color: '#E63329', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}
                  >
                    Rimuovi banner
                  </button>
                </div>
              )}

              <label className={t.lbl}>Contenuto articolo (HTML)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <textarea
                  value={formEv.content || ''}
                  onChange={e => setFormEv({ ...formEv, content: e.target.value })}
                  placeholder={'<h3>Titolo</h3>\n<p>Testo...</p>'}
                  style={{ minHeight: 140, padding: 10, border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5, outline: 'none', resize: 'vertical' }}
                />
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', overflow: 'auto', background: 'var(--surface)', minHeight: 140, fontSize: 13, lineHeight: 1.7 }}>
                  {formEv.content
                    ? <div dangerouslySetInnerHTML={{ __html: formEv.content }} style={{ color: 'var(--muted-dark)' }}/>
                    : <span style={{ color: 'var(--muted)', fontSize: 12 }}>Anteprima...</span>}
                </div>
              </div>
            </div>
            <div className={t.mftr}>
              <button className={t.btnS} onClick={() => setShowEv(false)}>Annulla</button>
              <button className={t.btnP} onClick={saveEv} disabled={saving}>
                {saving ? 'Salvo...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
