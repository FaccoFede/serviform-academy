'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { api, API_BASE_URL, resolveVideoUrl } from '@/lib/api'
import styles from '../AdminPage.module.css'
import t from '../table.module.css'

/**
 * Admin Catalogo Video — supporta due modalità di inserimento:
 *
 *  1. Upload di un file MP4/WebM/OGG che viene salvato sul server
 *     con URL relativo `/uploads/videos/...` (portabile tra macchine).
 *  2. Registrazione di un URL esterno (YouTube, Vimeo, Bunny, Loom,
 *     MP4 remoto, ecc.) salvato con mimeType `external/link`.
 *
 * Le unità didattiche referenziano gli elementi del catalogo, così
 * un admin può aggiornare una fonte video in un solo posto e tutte
 * le unità che la usano vedranno la modifica.
 */

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('sa_token')
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: 'Bearer ' + token } : {}
}

function formatSize(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'upload' | 'external'>('upload')

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // External URL state
  const [extTitle, setExtTitle] = useState('')
  const [extUrl, setExtUrl] = useState('')
  const [extSaving, setExtSaving] = useState(false)

  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.videoAssets.findAll()
      setVideos(Array.isArray(data) ? data : [])
    } catch {
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleFile = (f: File) => {
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '))
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    setMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title || file.name)

      const token = getToken()
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', API_BASE_URL + '/video-assets/upload')
        if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status < 300) resolve()
          else {
            try {
              reject(new Error(JSON.parse(xhr.responseText).message))
            } catch {
              reject(new Error('Upload fallito'))
            }
          }
        }
        xhr.onerror = () => reject(new Error('Errore di rete'))
        xhr.send(fd)
      })

      setMsg({ text: `"${title || file.name}" caricato.`, ok: true })
      setFile(null)
      setTitle('')
      if (inputRef.current) inputRef.current.value = ''
      load()
    } catch (e: any) {
      setMsg({ text: e.message, ok: false })
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleCreateExternal = async () => {
    if (!extUrl.trim()) return
    setExtSaving(true)
    setMsg(null)
    try {
      await api.videoAssets.createExternal(extTitle.trim() || extUrl.trim(), extUrl.trim())
      setMsg({ text: 'URL esterno registrato nel catalogo.', ok: true })
      setExtUrl('')
      setExtTitle('')
      load()
    } catch (e: any) {
      setMsg({ text: e.message, ok: false })
    } finally {
      setExtSaving(false)
    }
  }

  const handleDelete = async (id: string, videoTitle: string) => {
    if (!confirm(`Eliminare "${videoTitle}"?`)) return
    try {
      await api.videoAssets.remove(id)
      setMsg({ text: `"${videoTitle}" eliminato.`, ok: true })
      load()
    } catch (e: any) {
      setMsg({ text: e.message, ok: false })
    }
  }

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(resolveVideoUrl(url))
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <main className={styles.main}>
      <div className={t.hdr}>
        <div>
          <Link href="/admin" className={t.back}>← Admin</Link>
          <h1 className={styles.title}>Catalogo Video</h1>
          <p className={styles.desc}>
            {videos.length} video · upload diretto o URL esterni
          </p>
        </div>
      </div>

      {msg && (
        <div className={msg.ok ? t.ok : t.err}>
          {msg.text}
          <button onClick={() => setMsg(null)}>×</button>
        </div>
      )}

      {/* Tabs modalità */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['upload', 'external'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: mode === m ? 'var(--ink)' : 'var(--white)',
              color: mode === m ? '#fff' : 'var(--muted)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {m === 'upload' ? '⬆ Carica file' : '🔗 Registra URL esterno'}
          </button>
        ))}
      </div>

      {/* Form inserimento */}
      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 28,
        }}
      >
        {mode === 'upload' ? (
          <>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: '0 0 16px' }}>
              Carica nuovo video
            </h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '.5px',
                    marginBottom: 6,
                  }}
                >
                  Titolo
                </label>
                <input
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 13,
                    color: 'var(--ink)',
                    background: 'var(--white)',
                    boxSizing: 'border-box',
                  }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. Introduzione EngView 3D"
                />
              </div>

              <div style={{ flex: 2, minWidth: 240 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '.5px',
                    marginBottom: 6,
                  }}
                >
                  File video (MP4, WebM, OGG — max 500 MB)
                </label>
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                  style={{ fontSize: 13, color: 'var(--ink)' }}
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                style={{
                  padding: '9px 20px',
                  background: file && !uploading ? 'var(--red)' : 'var(--border)',
                  color: file && !uploading ? '#fff' : 'var(--muted)',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: file && !uploading ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                }}
              >
                {uploading ? `Caricamento ${progress}%…` : '⬆ Carica'}
              </button>
            </div>

            {uploading && (
              <div style={{ marginTop: 12, height: 6, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: 'var(--red)',
                    width: `${progress}%`,
                    transition: 'width 0.3s',
                    borderRadius: 100,
                  }}
                />
              </div>
            )}

            {file && !uploading && (
              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                {file.name} · {formatSize(file.size)}
              </p>
            )}
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: '0 0 16px' }}>
              Registra URL esterno
            </h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '.5px',
                    marginBottom: 6,
                  }}
                >
                  Titolo
                </label>
                <input
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                  value={extTitle}
                  onChange={(e) => setExtTitle(e.target.value)}
                  placeholder="Es. YouTube — Intro Sysform"
                />
              </div>

              <div style={{ flex: 2, minWidth: 280 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '.5px',
                    marginBottom: 6,
                  }}
                >
                  URL video
                </label>
                <input
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: 'var(--font-mono)',
                    boxSizing: 'border-box',
                  }}
                  value={extUrl}
                  onChange={(e) => setExtUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... o https://.../video.mp4"
                />
              </div>

              <button
                onClick={handleCreateExternal}
                disabled={!extUrl.trim() || extSaving}
                style={{
                  padding: '9px 20px',
                  background: extUrl.trim() && !extSaving ? 'var(--red)' : 'var(--border)',
                  color: extUrl.trim() && !extSaving ? '#fff' : 'var(--muted)',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: extUrl.trim() && !extSaving ? 'pointer' : 'not-allowed',
                }}
              >
                {extSaving ? 'Salvo…' : '+ Registra'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
              Supportati: YouTube, Vimeo, Bunny, Loom, MP4/WebM remoti.
              SharePoint e OneDrive non sono embeddabili per policy Microsoft.
            </p>
          </>
        )}
      </div>

      {/* Lista video */}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Caricamento…</p>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
          <p>Nessun video nel catalogo.</p>
        </div>
      ) : (
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead>
              <tr>
                <th>Titolo</th>
                <th>Tipo</th>
                <th>File / URL</th>
                <th>Dimensione</th>
                <th>Caricato il</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v: any) => {
                const isExternal = v.mimeType === 'external/link'
                return (
                  <tr key={v.id}>
                    <td className={t.tdBold}>{v.title}</td>
                    <td>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: isExternal ? '#067DB8' : 'var(--ink)',
                        }}
                      >
                        {isExternal ? '🔗 EXT' : '📁 FILE'}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {isExternal ? v.url : v.filename}
                    </td>
                    <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                      {isExternal ? '—' : formatSize(v.size)}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {new Date(v.createdAt).toLocaleDateString('it-IT')}
                    </td>
                    <td>
                      <button
                        onClick={() => copyUrl(v.url, v.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          background: copied === v.id ? '#EDFAF3' : 'var(--white)',
                          color: copied === v.id ? '#059669' : 'var(--muted)',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {copied === v.id ? '✓ Copiato' : '📋 Copia URL'}
                      </button>
                    </td>
                    <td className={t.actions}>
                      <button className={t.btnD} onClick={() => handleDelete(v.id, v.title)}>
                        Elimina
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
