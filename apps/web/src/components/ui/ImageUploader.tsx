'use client'
import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Props {
  onInsert: (url: string, alt?: string) => void
  onClose: () => void
}

/**
 * ImageUploader — modal per caricare un'immagine e ottenere l'URL da inserire nel contenuto.
 * Supporta: drag & drop, click to browse, URL remoto.
 * Dopo l'upload chiama onInsert(url) per inserire l'immagine nell'editor.
 */
export default function ImageUploader({ onInsert, onClose }: Props) {
  const { token } = useAuth()
  const [tab, setTab] = useState<'upload' | 'url'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [remoteUrl, setRemoteUrl] = useState('')
  const [alt, setAlt] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback((f: File) => {
    setError(null)
    if (f.size > 5 * 1024 * 1024) { setError('File troppo grande (max 5 MB)'); return }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(f.type)) {
      setError('Formato non supportato. Usa JPEG, PNG, GIF o WebP.'); return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(API_URL + '/uploads/image', {
        method: 'POST',
        headers: token ? { Authorization: 'Bearer ' + token } : {},
        body: fd,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Errore durante l\'upload')
      }
      const data = await res.json()
      onInsert(data.url, alt || file.name)
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoteInsert = () => {
    if (!remoteUrl.trim()) { setError('Inserisci un URL valido'); return }
    onInsert(remoteUrl.trim(), alt || 'immagine')
    onClose()
  }

  return (
    <div style={overlay}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={header}>
          <span style={headerTitle}>Inserisci immagine</span>
          <button style={closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div style={tabs}>
          <button style={tab === 'upload' ? tabActive : tabBtn} onClick={() => setTab('upload')}>
            Carica file
          </button>
          <button style={tab === 'url' ? tabActive : tabBtn} onClick={() => setTab('url')}>
            URL remoto
          </button>
        </div>

        {/* Body */}
        <div style={body}>
          {tab === 'upload' ? (
            <>
              <div
                style={{ ...dropzone, ...(dragging ? dropzoneActive : {}) }}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                {preview
                  ? <img src={preview} alt="preview" style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 6 }} />
                  : (
                    <>
                      <div style={{ fontSize: 28, opacity: 0.4, marginBottom: 8 }}>⬆</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>Trascina qui o clicca per selezionare</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>JPEG, PNG, GIF, WebP · max 5 MB</div>
                    </>
                  )
                }
                <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </div>

              {file && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                  {file.name} · {(file.size / 1024).toFixed(0)} KB
                </div>
              )}
            </>
          ) : (
            <div>
              <label style={fieldLabel}>URL immagine</label>
              <input
                style={input}
                type="url"
                value={remoteUrl}
                onChange={e => setRemoteUrl(e.target.value)}
                placeholder="https://example.com/immagine.jpg"
              />
              {remoteUrl && (
                <img src={remoteUrl} alt="preview" style={{ maxHeight: 100, maxWidth: '100%', borderRadius: 6, marginTop: 8 }}
                  onError={() => setError('URL non valido o immagine non raggiungibile')} />
              )}
            </div>
          )}

          {/* Alt text */}
          <div style={{ marginTop: 14 }}>
            <label style={fieldLabel}>Testo alternativo (alt)</label>
            <input
              style={input}
              type="text"
              value={alt}
              onChange={e => setAlt(e.target.value)}
              placeholder="Descrizione dell'immagine"
            />
          </div>

          {error && <div style={errorBox}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={footer}>
          <button style={cancelBtn} onClick={onClose}>Annulla</button>
          {tab === 'upload'
            ? <button style={file ? confirmBtn : disabledBtn} onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? 'Caricamento...' : 'Inserisci immagine'}
              </button>
            : <button style={remoteUrl ? confirmBtn : disabledBtn} onClick={handleRemoteInsert} disabled={!remoteUrl}>
                Inserisci URL
              </button>
          }
        </div>
      </div>
    </div>
  )
}

// ── Stili inline (nessuna dipendenza esterna) ───────────────────────────────
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
}
const modal: React.CSSProperties = {
  background: 'var(--white)', borderRadius: 14, maxWidth: 520, width: '100%',
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
}
const header: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 20px', borderBottom: '1px solid var(--border)',
}
const headerTitle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: 'var(--ink)' }
const closeBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)',
  background: 'transparent', cursor: 'pointer', fontSize: 17, color: 'var(--muted)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const tabs: React.CSSProperties = {
  display: 'flex', gap: 2, padding: '10px 20px 0',
  borderBottom: '1px solid var(--border)',
}
const tabBtn: React.CSSProperties = {
  padding: '7px 14px', border: 'none', background: 'transparent',
  fontSize: 13, color: 'var(--muted)', cursor: 'pointer', borderBottom: '2px solid transparent',
}
const tabActive: React.CSSProperties = {
  ...tabBtn, color: 'var(--red)', borderBottomColor: 'var(--red)', fontWeight: 700,
}
const body: React.CSSProperties = { padding: 20, flex: 1 }
const dropzone: React.CSSProperties = {
  border: '1.5px dashed var(--border)', borderRadius: 10, padding: '28px 20px',
  textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  minHeight: 120,
}
const dropzoneActive: React.CSSProperties = { borderColor: 'var(--red)', background: '#fff8f8' }
const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)',
  textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6,
}
const input: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)',
  fontSize: 13, color: 'var(--ink)', background: 'var(--white)', boxSizing: 'border-box',
}
const errorBox: React.CSSProperties = {
  marginTop: 10, padding: '8px 12px', borderRadius: 7,
  background: '#FFF1F0', color: '#E63329', fontSize: 12,
}
const footer: React.CSSProperties = {
  display: 'flex', gap: 10, justifyContent: 'flex-end',
  padding: '14px 20px', borderTop: '1px solid var(--border)',
}
const cancelBtn: React.CSSProperties = {
  padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--muted)',
}
const confirmBtn: React.CSSProperties = {
  padding: '8px 18px', borderRadius: 8, border: 'none',
  background: 'var(--red)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
}
const disabledBtn: React.CSSProperties = {
  ...confirmBtn, opacity: 0.4, cursor: 'not-allowed',
}
