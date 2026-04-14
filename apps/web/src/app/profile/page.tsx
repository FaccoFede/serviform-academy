'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import styles from './ProfilePage.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type Tab = 'info' | 'password'

interface Msg {
  text: string
  ok: boolean
}

export default function ProfilePage() {
  const { user, token, isLoading, logout } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<Tab>('info')

  // ── Form dati personali ────────────────────────────────────────────────────
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoMsg, setInfoMsg] = useState<Msg | null>(null)

  // ── Form password ─────────────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<Msg | null>(null)

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login')
  }, [isLoading, user, router])

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSavingInfo(true)
    setInfoMsg(null)

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (trimmedName.length < 2) {
      setInfoMsg({ text: 'Il nome deve avere almeno 2 caratteri.', ok: false })
      setSavingInfo(false)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setInfoMsg({ text: 'Inserisci un indirizzo email valido.', ok: false })
      setSavingInfo(false)
      return
    }

    try {
      const res = await fetch(API_URL + '/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        setInfoMsg({ text: data.message || 'Errore durante il salvataggio.', ok: false })
        return
      }

      setInfoMsg({ text: 'Profilo aggiornato con successo.', ok: true })

      // Se l'email è cambiata, il backend emette un nuovo token
      if (data.tokenRefreshed && data.accessToken) {
        localStorage.setItem('sa_token', data.accessToken)
        // Ricarica per aggiornare il context
        setTimeout(() => window.location.reload(), 800)
      }
    } catch {
      setInfoMsg({ text: 'Errore di rete. Riprova.', ok: false })
    } finally {
      setSavingInfo(false)
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return

    setPwdMsg(null)

    if (newPwd.length < 8) {
      setPwdMsg({ text: 'La nuova password deve avere almeno 8 caratteri.', ok: false })
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ text: 'Le due password non coincidono.', ok: false })
      return
    }
    if (newPwd === currentPwd) {
      setPwdMsg({ text: 'La nuova password deve essere diversa da quella attuale.', ok: false })
      return
    }

    setSavingPwd(true)

    try {
      const res = await fetch(API_URL + '/auth/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      })

      const data = await res.json()

      if (!res.ok) {
        setPwdMsg({ text: data.message || 'Errore durante il cambio password.', ok: false })
        return
      }

      setPwdMsg({ text: 'Password cambiata con successo. Effettua di nuovo il login.', ok: true })
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')

      // Dopo cambio password: logout per sicurezza
      setTimeout(() => {
        logout()
        router.push('/auth/login')
      }, 2000)
    } catch {
      setPwdMsg({ text: 'Errore di rete. Riprova.', ok: false })
    } finally {
      setSavingPwd(false)
    }
  }

  if (isLoading) return <div className={styles.loading}>Caricamento...</div>
  if (!user) return null

  const displayName =
    user.firstName ||
    (user.name || '').split(' ')[0] ||
    user.email.split('@')[0]

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <nav className={styles.breadcrumb}>
            <Link href="/dashboard" className={styles.bcLink}>dashboard</Link>
            <span>/</span>
            <span>profilo</span>
          </nav>
          <h1 className={styles.title}>Il tuo profilo</h1>
          <p className={styles.subtitle}>Gestisci le informazioni del tuo account</p>
        </div>
      </div>

      <div className={styles.body}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              {displayName[0]?.toUpperCase() || '?'}
            </div>
            <div className={styles.avatarName}>{user.name || displayName}</div>
            <div className={styles.avatarEmail}>{user.email}</div>
            {user.role !== 'USER' && (
              <span className={styles.roleBadge}>{user.role}</span>
            )}
          </div>

          <nav className={styles.sideNav}>
            <button
              className={[styles.sideNavItem, tab === 'info' ? styles.sideNavActive : ''].join(' ')}
              onClick={() => setTab('info')}
            >
              <svg viewBox="0 0 14 14" fill="none" width={14} height={14}>
                <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Dati personali
            </button>
            <button
              className={[styles.sideNavItem, tab === 'password' ? styles.sideNavActive : ''].join(' ')}
              onClick={() => setTab('password')}
            >
              <svg viewBox="0 0 14 14" fill="none" width={14} height={14}>
                <rect x="2.5" y="6" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Cambia password
            </button>
            <Link
              href="/profile/certificates"
              className={styles.sideNavItem}
              style={{ textDecoration: 'none' }}
            >
              <svg viewBox="0 0 14 14" fill="none" width={14} height={14}>
                <circle cx="7" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M5 9l-1 4 3-1.5L10 13 9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              I miei badge
            </Link>
          </nav>
        </aside>

        {/* Contenuto principale */}
        <main className={styles.main}>
          {/* ── Tab: dati personali ──────────────────────────────────────── */}
          {tab === 'info' && (
            <form className={styles.card} onSubmit={saveInfo}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Dati personali</h2>
                <p className={styles.cardDesc}>Aggiorna il tuo nome e indirizzo email.</p>
              </div>

              <div className={styles.fields}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="name">
                    Nome completo
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={styles.input}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Es. Mario Rossi"
                    minLength={2}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="email">
                    Indirizzo email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="mario.rossi@example.com"
                    required
                  />
                  <span className={styles.hint}>
                    Se cambi email, verrai disconnesso e dovrai accedere di nuovo.
                  </span>
                </div>
              </div>

              {infoMsg && (
                <div className={infoMsg.ok ? styles.msgOk : styles.msgErr}>
                  {infoMsg.text}
                </div>
              )}

              <div className={styles.actions}>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={savingInfo}
                >
                  {savingInfo ? 'Salvataggio...' : 'Salva modifiche'}
                </button>
              </div>
            </form>
          )}

          {/* ── Tab: password ────────────────────────────────────────────── */}
          {tab === 'password' && (
            <form className={styles.card} onSubmit={savePassword}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Cambia password</h2>
                <p className={styles.cardDesc}>
                  Inserisci la password attuale e quella nuova (almeno 8 caratteri).
                </p>
              </div>

              <div className={styles.fields}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="currentPwd">
                    Password attuale
                  </label>
                  <input
                    id="currentPwd"
                    type="password"
                    className={styles.input}
                    value={currentPwd}
                    onChange={e => setCurrentPwd(e.target.value)}
                    placeholder="La tua password attuale"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="newPwd">
                    Nuova password
                  </label>
                  <input
                    id="newPwd"
                    type="password"
                    className={styles.input}
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    placeholder="Almeno 8 caratteri"
                    minLength={8}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="confirmPwd">
                    Conferma nuova password
                  </label>
                  <input
                    id="confirmPwd"
                    type="password"
                    className={styles.input}
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    placeholder="Ripeti la nuova password"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              {pwdMsg && (
                <div className={pwdMsg.ok ? styles.msgOk : styles.msgErr}>
                  {pwdMsg.text}
                </div>
              )}

              <div className={styles.actions}>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={savingPwd}
                >
                  {savingPwd ? 'Aggiornamento...' : 'Cambia password'}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  )
}
