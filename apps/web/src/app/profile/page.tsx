'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import styles from './ProfilePage.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return <svg viewBox="0 0 24 24" fill="none" width={size} height={size} style={{flexShrink:0}}><path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

export default function ProfilePage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ t: 'Le nuove password non coincidono.', ok: false }); return
    }
    if (form.newPassword.length < 8) {
      setMsg({ t: 'La password deve essere almeno 8 caratteri.', ok: false }); return
    }
    setSaving(true); setMsg(null)
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Errore')
      setMsg({ t: 'Password aggiornata con successo.', ok: true })
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (e: any) {
      setMsg({ t: e.message, ok: false })
    } finally {
      setSaving(false)
    }
  }

  if (!user) { router.push('/auth/login'); return null }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <nav className={styles.breadcrumb}>
          <Link href="/dashboard" className={styles.bcLink}>Dashboard</Link>
          <Icon d="M9 5l7 7-7 7" size={11}/>
          <span>Profilo</span>
        </nav>
        <h1 className={styles.title}>Il mio profilo</h1>

        <div className={styles.grid}>
          {/* Info utente */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" size={15}/>
              Informazioni account
            </div>
            <div className={styles.infoList}>
              {[
                { l: 'Email', v: user.email },
                { l: 'Nome', v: user.name || '—' },
                { l: 'Ruolo', v: user.role === 'ADMIN' ? 'Amministratore' : user.role === 'TEAM_ADMIN' ? 'Team Admin' : 'Utente' },
                { l: 'Azienda', v: user.company?.name || '—' },
              ].map(row => (
                <div key={row.l} className={styles.infoRow}>
                  <span className={styles.infoLabel}>{row.l}</span>
                  <span className={styles.infoValue}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cambio password */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Icon d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" size={15}/>
              Cambia password
            </div>
            <form onSubmit={handleChangePassword} className={styles.form}>
              {msg && <div className={msg.ok ? styles.ok : styles.err}>{msg.t}</div>}
              {[
                { key: 'currentPassword', label: 'Password attuale', ph: '••••••••' },
                { key: 'newPassword', label: 'Nuova password', ph: 'Min. 8 caratteri' },
                { key: 'confirmPassword', label: 'Conferma nuova password', ph: '••••••••' },
              ].map(f => (
                <div key={f.key} className={styles.field}>
                  <label className={styles.label}>{f.label}</label>
                  <input
                    className={styles.input}
                    type="password"
                    placeholder={f.ph}
                    value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    required
                  />
                </div>
              ))}
              <button className={styles.btn} type="submit" disabled={saving}>
                {saving ? 'Salvo...' : 'Aggiorna password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
