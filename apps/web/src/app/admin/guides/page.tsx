'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminPage.module.css'
import t from '../table.module.css'

/**
 * Admin Catalogo Guide — gestione centralizzata delle guide Zendesk.
 *
 * L'admin inserisce SOLO l'URL, il backend recupera automaticamente
 * il titolo dalla pagina remota. Le guide qui registrate diventano
 * disponibili nella selezione all'interno dell'editor delle unità.
 *
 * Operazioni disponibili:
 *  • Aggiunta nuova guida (con fetch automatico del titolo)
 *  • Modifica manuale del titolo
 *  • Refresh del titolo dal remoto
 *  • Eliminazione (le GuideReference esistenti conservano titolo/URL
 *    copiati — perdono solo il link al catalogo).
 */
export default function AdminGuidesCatalogPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setRows((await api.guideCatalog.findAll()) as any[])
    } catch {
      setRows([])
    }
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const addGuide = async () => {
    if (!newUrl.trim()) return
    setAdding(true)
    setMsg(null)
    try {
      await api.guideCatalog.create({ url: newUrl.trim() })
      setNewUrl('')
      setMsg({ text: 'Guida aggiunta al catalogo.', ok: true })
      load()
    } catch (e: any) {
      setMsg({ text: e.message || 'Errore aggiunta', ok: false })
    }
    setAdding(false)
  }

  const saveTitle = async (id: string) => {
    try {
      await api.guideCatalog.update(id, { title: editTitle })
      setEditId(null)
      setEditTitle('')
      load()
    } catch (e: any) {
      setMsg({ text: e.message, ok: false })
    }
  }

  const refreshTitle = async (id: string) => {
    try {
      await api.guideCatalog.refreshTitle(id)
      setMsg({ text: 'Titolo aggiornato dalla pagina remota.', ok: true })
      load()
    } catch (e: any) {
      setMsg({ text: e.message || 'Impossibile recuperare il titolo', ok: false })
    }
  }

  const del = async (id: string, title: string) => {
    if (!confirm(`Eliminare "${title}" dal catalogo?`)) return
    try {
      await api.guideCatalog.remove(id)
      load()
    } catch (e: any) {
      setMsg({ text: e.message, ok: false })
    }
  }

  const filtered = rows.filter(
    (r) =>
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      r.url.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <main className={styles.main}>
      <div className={t.hdr}>
        <div>
          <Link href="/admin" className={t.back}>← Admin</Link>
          <h1 className={styles.title}>Catalogo Guide</h1>
          <p className={styles.desc}>{rows.length} guide registrate · titolo recuperato automaticamente</p>
        </div>
      </div>

      {msg && (
        <div className={msg.ok ? t.ok : t.err}>
          {msg.text}
          <button onClick={() => setMsg(null)}>×</button>
        </div>
      )}

      {/* Form aggiunta */}
      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: '0 0 12px' }}>
          Aggiungi nuova guida
        </h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            style={{
              flex: 1,
              padding: '9px 12px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              boxSizing: 'border-box',
            }}
            placeholder="https://support.serviform.com/hc/it/articles/360001234567-Titolo-guida"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGuide()}
          />
          <button
            onClick={addGuide}
            disabled={!newUrl.trim() || adding}
            style={{
              padding: '9px 20px',
              background: newUrl.trim() && !adding ? 'var(--red)' : 'var(--border)',
              color: newUrl.trim() && !adding ? '#fff' : 'var(--muted)',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: newUrl.trim() && !adding ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
            }}
          >
            {adding ? 'Aggiungo…' : '+ Aggiungi'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
          Il titolo viene estratto automaticamente dal tag {'<title>'} della pagina.
          Se il recupero fallisce, l'URL viene usato come titolo di fallback.
        </p>
      </div>

      <input
        className={t.search}
        placeholder="Cerca per titolo o URL…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loading ? (
        <p>Caricamento…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📘</div>
          <p>Nessuna guida nel catalogo.</p>
        </div>
      ) : (
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead>
              <tr>
                <th>Titolo</th>
                <th>URL</th>
                <th>Zendesk ID</th>
                <th>Creata</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className={t.tdBold}>
                    {editId === r.id ? (
                      <input
                        autoFocus
                        style={{
                          padding: '5px 8px',
                          border: '1px solid var(--border)',
                          borderRadius: 5,
                          fontSize: 13,
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTitle(r.id)
                          if (e.key === 'Escape') {
                            setEditId(null)
                            setEditTitle('')
                          }
                        }}
                      />
                    ) : (
                      r.title
                    )}
                  </td>
                  <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: '#067DB8', textDecoration: 'none' }}>
                      {r.url}
                    </a>
                  </td>
                  <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                    {r.zendeskId || '—'}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {new Date(r.createdAt).toLocaleDateString('it-IT')}
                  </td>
                  <td className={t.actions}>
                    {editId === r.id ? (
                      <>
                        <button className={t.btnP} onClick={() => saveTitle(r.id)}>Salva</button>
                        <button className={t.btnS} onClick={() => { setEditId(null); setEditTitle('') }}>Annulla</button>
                      </>
                    ) : (
                      <>
                        <button className={t.btnE} onClick={() => { setEditId(r.id); setEditTitle(r.title) }}>
                          Modifica
                        </button>
                        <button
                          onClick={() => refreshTitle(r.id)}
                          title="Rifetcha il titolo dalla pagina remota"
                          style={{
                            padding: '4px 10px',
                            borderRadius: 5,
                            border: '1px solid var(--border)',
                            background: 'var(--white)',
                            color: 'var(--muted)',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          ↻ Refresh
                        </button>
                        <button className={t.btnD} onClick={() => del(r.id, r.title)}>Elimina</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
