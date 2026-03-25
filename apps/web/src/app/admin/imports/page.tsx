'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from '../AdminPage.module.css'
import tableStyles from '../companies/CompaniesAdmin.module.css'
import importStyles from './ImportsAdmin.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function authHeaders(contentType?: string) {
  const token = localStorage.getItem('sa_token')
  const base = token ? { Authorization: 'Bearer ' + token } : {}
  return contentType ? { ...base, 'Content-Type': contentType } : base
}

type ImportType = 'companies' | 'users'

const TEMPLATES: Record<ImportType, { headers: string; example: string; notes: string[] }> = {
  companies: {
    headers: 'name,slug,contractType,assistanceExpiresAt,notes',
    example: 'Rossi S.r.l.,rossi-srl,Standard,2027-12-31,Cliente storico',
    notes: [
      'name: ragione sociale (obbligatorio)',
      'slug: identificativo URL univoco (obbligatorio)',
      'contractType: Standard | Enterprise | Trial | Personalizzato',
      'assistanceExpiresAt: formato YYYY-MM-DD (vuoto = illimitata)',
      'notes: note interne (opzionale)',
    ],
  },
  users: {
    headers: 'email,name,password,role,companySlug',
    example: 'mario.rossi@example.it,Mario Rossi,Password123!,USER,rossi-srl',
    notes: [
      'email: indirizzo email (obbligatorio, univoco)',
      'name: nome completo (opzionale)',
      'password: password iniziale (obbligatorio per nuovi utenti)',
      'role: USER | TEAM_ADMIN | ADMIN (default: USER)',
      'companySlug: slug dell\'azienda di appartenenza (opzionale)',
    ],
  },
}

export default function AdminImportsPage() {
  const [importType, setImportType] = useState<ImportType>('companies')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setMsg(null)

    // Preview prime 5 righe
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = text
        .split('\n')
        .slice(0, 6)
        .map(r => r.split(',').map(c => c.trim().replace(/^"|"$/g, '')))
      setPreview(rows)
    }
    reader.readAsText(f)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', importType)

      const res = await fetch(API_URL + '/imports/csv', {
        method: 'POST',
        headers: authHeaders() as any,
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Errore durante l\'importazione')

      setResult(data)
      setMsg({ text: `Importazione completata: ${data.imported} importati, ${data.failed} falliti.`, type: data.failed > 0 ? 'error' : 'success' })
      setFile(null)
      setPreview([])
    } catch (e: any) {
      setMsg({ text: e.message, type: 'error' })
    } finally { setUploading(false) }
  }

  function downloadTemplate() {
    const tpl = TEMPLATES[importType]
    const content = [tpl.headers, tpl.example].join('\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template_${importType}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tpl = TEMPLATES[importType]

  return (
    <main className={styles.main}>
      <div className={tableStyles.pageHeader}>
        <div>
          <Link href="/admin" className={tableStyles.back}>← Admin</Link>
          <h1 className={styles.title}>Import CSV</h1>
          <p className={styles.desc}>Importa aziende e utenti in blocco tramite file CSV</p>
        </div>
      </div>

      {msg && (
        <div className={`${tableStyles.msg} ${msg.type === 'error' ? tableStyles.msgError : tableStyles.msgSuccess}`}>
          {msg.text}
          <button onClick={() => setMsg(null)}>×</button>
        </div>
      )}

      <div className={importStyles.layout}>
        {/* Configurazione */}
        <div className={importStyles.card}>
          <h2 className={importStyles.cardTitle}>Tipo importazione</h2>

          <div className={importStyles.typeSelector}>
            {(['companies', 'users'] as ImportType[]).map(t => (
              <button
                key={t}
                className={[importStyles.typeBtn, importType === t ? importStyles.typeBtnActive : ''].join(' ')}
                onClick={() => { setImportType(t); setFile(null); setPreview([]); setResult(null) }}
              >
                {t === 'companies' ? '🏢 Aziende' : '👤 Utenti'}
              </button>
            ))}
          </div>

          <div className={importStyles.templateSection}>
            <h3 className={importStyles.sectionLabel}>Struttura CSV richiesta</h3>
            <code className={importStyles.codeBlock}>{tpl.headers}</code>
            <ul className={importStyles.noteList}>
              {tpl.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
            <button className={tableStyles.btnSecondary} onClick={downloadTemplate} style={{ marginTop: 16 }}>
              ⬇ Scarica template CSV
            </button>
          </div>
        </div>

        {/* Upload */}
        <div className={importStyles.card}>
          <h2 className={importStyles.cardTitle}>Carica file</h2>

          <label className={importStyles.dropzone}>
            <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
            {file ? (
              <div className={importStyles.fileSelected}>
                <span className={importStyles.fileName}>{file.name}</span>
                <span className={importStyles.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ) : (
              <div className={importStyles.dropzonePrompt}>
                <span className={importStyles.dropzoneIcon}>⬆</span>
                <span>Clicca per selezionare un file CSV</span>
              </div>
            )}
          </label>

          {/* Preview */}
          {preview.length > 0 && (
            <div className={importStyles.previewSection}>
              <h3 className={importStyles.sectionLabel}>Anteprima ({preview.length - 1} righe visibili)</h3>
              <div className={tableStyles.tableWrap}>
                <table className={tableStyles.table}>
                  <thead>
                    <tr>{preview[0]?.map((h, i) => <th key={i}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.slice(1).map((row, i) => (
                      <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {file && (
            <button
              className={tableStyles.btnPrimary}
              onClick={handleUpload}
              disabled={uploading}
              style={{ marginTop: 20, width: '100%' }}
            >
              {uploading ? 'Importazione in corso...' : `Importa ${importType === 'companies' ? 'aziende' : 'utenti'}`}
            </button>
          )}

          {/* Risultato */}
          {result && (
            <div className={importStyles.resultSection}>
              <div className={importStyles.resultStats}>
                <div className={importStyles.resultStat}>
                  <span className={importStyles.resultNum}>{result.imported}</span>
                  <span className={importStyles.resultLabel}>importati</span>
                </div>
                <div className={importStyles.resultStat}>
                  <span className={importStyles.resultNum} style={{ color: result.failed > 0 ? 'var(--red)' : undefined }}>{result.failed}</span>
                  <span className={importStyles.resultLabel}>falliti</span>
                </div>
                <div className={importStyles.resultStat}>
                  <span className={importStyles.resultNum}>{result.totalRows}</span>
                  <span className={importStyles.resultLabel}>totali</span>
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div className={importStyles.errorList}>
                  <h4>Errori:</h4>
                  {result.errors.slice(0, 10).map((e: any, i: number) => (
                    <p key={i} className={importStyles.errorItem}>Riga {e.row}: {e.message}</p>
                  ))}
                  {result.errors.length > 10 && <p>...e altri {result.errors.length - 10} errori.</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
