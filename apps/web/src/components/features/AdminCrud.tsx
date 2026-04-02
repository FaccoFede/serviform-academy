'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import styles from './AdminCrud.module.css'

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
}

interface FormField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'richtext' | 'custom'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  loadOptions?: () => Promise<{ value: string; label: string }[]>
  /** Render personalizzato — usato quando type === 'custom' */
  customRender?: () => React.ReactNode
}

interface AdminCrudProps {
  title: string
  columns: Column[]
  fetchItems: () => Promise<any[]>
  onDelete?: (id: string) => Promise<void>
  onSave?: (data: any) => Promise<void>
  onUpdate?: (id: string, data: any) => Promise<void>
  formFields: FormField[]
  emptyMessage?: string
  /** Callback chiamata quando si apre il form di modifica — usata per precaricare stati custom */
  onEdit?: (item: any) => void | Promise<void>
}

export default function AdminCrud({
  title, columns, fetchItems, onDelete, onSave, onUpdate,
  formFields, emptyMessage, onEdit,
}: AdminCrudProps) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, { value: string; label: string }[]>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try { setItems(await fetchItems()) } catch { setItems([]) }
    setLoading(false)
  }, [fetchItems])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    formFields.forEach(async (f) => {
      if (f.loadOptions) {
        try {
          const opts = await f.loadOptions()
          setDynamicOptions(prev => ({ ...prev, [f.key]: opts }))
        } catch {}
      }
    })
  }, [formFields])

  function openCreate() {
    setEditItem(null)
    setFormData({})
    setShowForm(true)
    setMsg(null)
  }

  async function openEdit(item: any) {
    setEditItem(item)
    const data: Record<string, any> = {}
    formFields.forEach(f => { data[f.key] = item[f.key] ?? '' })
    setFormData(data)
    // Chiama onEdit per precaricare stati custom (VideoSelector, GuidesEditor...)
    if (onEdit) await onEdit(item)
    setShowForm(true)
    setMsg(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      if (editItem && onUpdate) {
        await onUpdate(editItem.id, formData)
        setMsg({ text: 'Aggiornato con successo', type: 'success' })
      } else if (onSave) {
        await onSave(formData)
        setMsg({ text: 'Creato con successo', type: 'success' })
      }
      setShowForm(false)
      setFormData({})
      setEditItem(null)
      await load()
    } catch (err) {
      setMsg({ text: 'Errore: ' + (err instanceof Error ? err.message : 'sconosciuto'), type: 'error' })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!onDelete || !confirm('Sei sicuro di voler eliminare questo elemento?')) return
    try {
      await onDelete(id)
      setMsg({ text: 'Eliminato con successo', type: 'success' })
      await load()
    } catch (err) {
      setMsg({ text: 'Errore eliminazione: ' + (err instanceof Error ? err.message : ''), type: 'error' })
    }
  }

  function getFieldOptions(field: FormField): { value: string; label: string }[] {
    if (field.loadOptions && dynamicOptions[field.key]) return dynamicOptions[field.key]
    return field.options || []
  }

  return (
    <main className={styles.main}>
      <Link href="/admin" className={styles.back}>
        <svg viewBox="0 0 14 14" fill="none" width={14} height={14}>
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Admin
      </Link>

      <div className={styles.header}>
        <h1>{title}</h1>
        {onSave && (
          <button className={styles.createBtn} onClick={openCreate}>
            <svg viewBox="0 0 16 16" fill="none" width={14} height={14}>
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Nuovo
          </button>
        )}
      </div>

      {msg && (
        <div className={msg.type === 'success' ? styles.msgSuccess : styles.msgError}>
          {msg.text}
        </div>
      )}

      {/* Form modale */}
      {showForm && (
        <div className={styles.formOverlay} onClick={() => setShowForm(false)}>
          <form className={styles.form} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
              <h2>{editItem ? 'Modifica' : 'Nuovo elemento'}</h2>
              <button type="button" className={styles.formClose} onClick={() => setShowForm(false)}>
                <svg viewBox="0 0 14 14" fill="none" width={14} height={14}>
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {formFields.map(f => (
              <div key={f.key} className={styles.field}>
                <label>{f.label}{f.required && ' *'}</label>

                {/* ── CUSTOM render (VideoSelector, GuidesEditor, ecc.) ── */}
                {f.type === 'custom' && f.customRender ? (
                  f.customRender()
                ) : f.type === 'select' ? (
                  <select
                    value={formData[f.key] || ''}
                    onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    required={f.required}
                  >
                    <option value="">— Seleziona —</option>
                    {getFieldOptions(f).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : f.type === 'textarea' || f.type === 'richtext' ? (
                  <textarea
                    value={formData[f.key] || ''}
                    onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    required={f.required}
                    rows={f.type === 'richtext' ? 14 : 4}
                  />
                ) : f.type === 'number' ? (
                  <input
                    type="number"
                    value={formData[f.key] || ''}
                    onChange={e => setFormData({ ...formData, [f.key]: Number(e.target.value) })}
                    placeholder={f.placeholder}
                    required={f.required}
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[f.key] || ''}
                    onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    required={f.required}
                  />
                )}
              </div>
            ))}

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Annulla</button>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? 'Salvataggio...' : (editItem ? 'Aggiorna' : 'Crea')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabella */}
      {loading ? (
        <div className={styles.loading}>Caricamento...</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <svg viewBox="0 0 48 48" fill="none" width={48} height={48}>
            <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M6 18h36M18 18v20" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <p>{emptyMessage || 'Nessun elemento. Clicca "Nuovo" per iniziare.'}</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map(c => <th key={c.key}>{c.label}</th>)}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  {columns.map(c => (
                    <td key={c.key}>
                      {c.render ? c.render(item[c.key], item) : (item[c.key] ?? '—')}
                    </td>
                  ))}
                  <td className={styles.actions}>
                    {onUpdate && (
                      <button className={styles.editBtn} onClick={() => openEdit(item)}>Modifica</button>
                    )}
                    {onDelete && (
                      <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)}>Elimina</button>
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
