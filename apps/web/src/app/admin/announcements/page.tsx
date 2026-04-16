'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminPage.module.css'
import t from '../table.module.css'

const SECTIONS = [
  { v: 'NEWS',   l: 'Novità' },
  { v: 'EVENTS', l: 'Eventi' },
  { v: 'PRESS',  l: 'Comunicati' },
  { v: 'RULES',  l: 'Regole' },
]

function Icon({ d, size = 14 }: { d: string; size?: number }) {
  return <svg viewBox="0 0 24 24" fill="none" width={size} height={size} style={{flexShrink:0}}><path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

export default function AdminAnnouncementsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(false)
  const [edit, setEdit] = useState<any>(null)
  const [form, setForm] = useState<any>({ section: 'NEWS', published: false, isPinned: false })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null)

  const load = async () => { setLoading(true); try { setRows(await api.announcements.findAll()) } catch {} finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const openNew = () => { setEdit(null); setForm({ section: 'NEWS', published: false, isPinned: false }); setMsg(null); setShow(true) }
  const openEdit = (r: any) => {
    setEdit(r)
    setForm({ title: r.title, body: r.body, section: r.section || 'NEWS', published: r.published, isPinned: r.isPinned || false, bannerUrl: r.bannerUrl || '', content: r.content || '', expiresAt: r.expiresAt?.slice(0, 10) || '' })
    setMsg(null); setShow(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (edit) await api.announcements.update(edit.id, form)
      else await api.announcements.create(form)
      setMsg({ t: edit ? 'Aggiornato.' : 'Creato.', ok: true }); setShow(false); load()
    } catch (e: any) { setMsg({ t: e.message, ok: false }) }
    finally { setSaving(false) }
  }

  const del = async (id: string) => { if (!confirm('Eliminare?')) return; try { await api.announcements.remove(id); load() } catch (e: any) { setMsg({ t: e.message, ok: false }) } }
  const toggle = async (r: any) => { await api.announcements.update(r.id, { published: !r.published }); load() }
  const pin = async (r: any) => { await api.announcements.update(r.id, { isPinned: !r.isPinned }); load() }

  const sectionLabel = (s: string) => SECTIONS.find(x => x.v === s)?.l || s

  return (
    <main className={styles.main}>
      <div className={t.hdr}>
        <div>
          <Link href="/admin" className={t.back}>← Admin</Link>
          <h1 className={styles.title}>Comunicazione &amp; Eventi</h1>
          <p className={styles.desc}>{rows.length} comunicazioni</p>
        </div>
        <button className={t.btnP} onClick={openNew}>+ Nuova comunicazione</button>
      </div>
      {msg && <div className={msg.ok ? t.ok : t.err}>{msg.t}<button onClick={() => setMsg(null)}>×</button></div>}
      {loading ? <p style={{ color: 'var(--muted)', fontSize: 14 }}>Caricamento...</p> : (
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead><tr><th>Titolo</th><th>Sezione</th><th>Stato</th><th>Pin</th><th>Banner</th><th></th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className={t.tdBold}>{r.title}</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--surface)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{sectionLabel(r.section || 'NEWS')}</span></td>
                  <td>
                    <button onClick={() => toggle(r)} style={{ padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', background: r.published ? '#ECFDF5' : 'var(--surface)', color: r.published ? '#059669' : 'var(--muted)' }}>
                      {r.published ? '● Pubbl.' : '○ Bozza'}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => pin(r)} style={{ padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', background: r.isPinned ? '#FFF7ED' : 'var(--surface)', color: r.isPinned ? '#D97706' : 'var(--muted)' }}>
                      {r.isPinned ? '★ In primo piano' : '☆ Normale'}
                    </button>
                  </td>
                  <td>{r.bannerUrl ? <span style={{ color: '#059669', fontSize: 12, fontWeight: 700 }}>✓ Sì</span> : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>}</td>
                  <td className={t.actions}>
                    <button className={t.btnE} onClick={() => openEdit(r)}>Modifica</button>
                    <button className={t.btnD} onClick={() => del(r.id)}>Elimina</button>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={6} className={t.empty}>Nessuna comunicazione.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {show && (
        <div className={t.overlay}>
          <div className={t.modal} style={{ maxWidth: 640 }}>
            <div className={t.mhdr}><h2>{edit ? 'Modifica' : 'Nuova'} comunicazione</h2><button onClick={() => setShow(false)}>×</button></div>
            <div className={t.mbody}>
              {msg && <div className={msg.ok ? t.ok : t.err}>{msg.t}</div>}

              <label className={t.lbl}>Titolo *</label>
              <input className={t.inp} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titolo comunicazione..."/>

              <label className={t.lbl}>Testo breve *</label>
              <textarea className={t.ta} rows={2} value={form.body || ''} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Descrizione breve..."/>

              <label className={t.lbl}>Sezione</label>
              <select className={t.inp} value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}>
                {SECTIONS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>

              <label className={t.lbl}>URL Banner/Copertina</label>
              <input className={t.inp} value={form.bannerUrl || ''} onChange={e => setForm({ ...form, bannerUrl: e.target.value })} placeholder="https://..."/>

              <label className={t.lbl}>Contenuto articolo (HTML)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <textarea
                  value={form.content || ''}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder={'<h3>Titolo</h3>\n<p>Testo...</p>'}
                  style={{ minHeight: 160, padding: 10, border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5, outline: 'none', resize: 'vertical' }}
                />
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', overflow: 'auto', background: 'var(--surface)', minHeight: 160, fontSize: 13, lineHeight: 1.7 }}>
                  {form.content ? <div dangerouslySetInnerHTML={{ __html: form.content }} style={{ color: 'var(--muted-dark)' }}/> : <span style={{ color: 'var(--muted)', fontSize: 12 }}>Anteprima...</span>}
                </div>
              </div>

              <label className={t.lbl}>Scadenza (vuoto = mai)</label>
              <input className={t.inp} type="date" value={form.expiresAt || ''} onChange={e => setForm({ ...form, expiresAt: e.target.value || null })}/>

              <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!form.published} onChange={e => setForm({ ...form, published: e.target.checked })}/>
                  Pubblica subito
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!form.isPinned} onChange={e => setForm({ ...form, isPinned: e.target.checked })}/>
                  In primo piano
                </label>
              </div>
            </div>
            <div className={t.mftr}>
              <button className={t.btnS} onClick={() => setShow(false)}>Annulla</button>
              <button className={t.btnP} onClick={save} disabled={saving}>{saving ? 'Salvo...' : 'Salva'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
