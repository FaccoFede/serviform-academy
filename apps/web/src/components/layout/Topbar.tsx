'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import styles from './Topbar.module.css'

// ─────────────────────────────────────────────────────────────────────────────
// LOGO CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
// Il logo SVG e il testo vengono sempre mostrati insieme.
//
// Per attivare il logo SVG:
//   1. Copia il file in: apps/web/public/logo.svg
//   2. Imposta SHOW_LOGO = true
//
// Il logo si adatta automaticamente all'altezza della topbar via CSS.
// Modifica BRAND_TEXT per cambiare il testo affiancato al logo.
const SHOW_LOGO  = true                  // false = nasconde il logo SVG, mostra solo testo
const LOGO_PATH  = '/logo.svg'           // percorso relativo da public/
const BRAND_TEXT = 'Serviform Academy'   // testo accanto al logo
// ─────────────────────────────────────────────────────────────────────────────

const NAV = [
  { href: '/catalog',  label: 'Corsi' },
  //{ href: '/newsroom', label: 'Newsroom' },
]

export default function Topbar() {
  const pathname = usePathname()
  const { user, logout, isLoading } = useAuth()
  const displayName = (user as any)?.name || user?.email?.split('@')[0] || ''

  const [userOpen, setUserOpen] = useState(false)
  const [annOpen,  setAnnOpen]  = useState(false)
  const userRef = useRef<HTMLDivElement>(null)
  const annRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
      if (annRef.current  && !annRef.current.contains(e.target as Node))  setAnnOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    setUserOpen(false)
    await logout()
  }

  return (
    <header className={styles.bar}>

      {/* ── LOGO + TESTO ──────────────────────────────────────────── */}
      {/* Logo SVG e testo "Serviform Academy" sempre affiancati.     */}
      {/* Il logo usa object-fit: contain e si scala via CSS puro.    */}
      <Link href="/" className={styles.logoWrap}>
        {SHOW_LOGO && (
          <div className={styles.logoImgWrap}>
            <Image
              src={LOGO_PATH}
              alt=""
              fill
              priority
              className={styles.logoImg}
            />
          </div>
        )}
        <span className={styles.brand}>{BRAND_TEXT}</span>
      </Link>

      {/* ── NAV ───────────────────────────────────────────────────── */}
      <nav className={styles.nav}>
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={[styles.navLink, pathname?.startsWith(item.href) ? styles.navActive : ''].join(' ')}
          >
            {item.label}
          </Link>
        ))}
        {user?.role === 'ADMIN' && (
          <Link
            href="/admin"
            className={[styles.navLink, pathname?.startsWith('/admin') ? styles.navActive : ''].join(' ')}
          >
            Admin
          </Link>
        )}
      </nav>

      {/* ── RIGHT ZONE ────────────────────────────────────────────── */}
      <div className={styles.right}>

        {!isLoading && user && (
          <>
            {/* Campanella annunci */}
            <div className={styles.dd} ref={annRef}>
              <button
                className={styles.iconBtn}
                onClick={() => { setAnnOpen(v => !v); setUserOpen(false) }}
                aria-label="Comunicazioni"
              >
                <svg viewBox="0 0 20 20" fill="none" width={18} height={18}>
                  <path d="M10 2a6 6 0 00-6 6c0 3.5-1.5 5-1.5 5h15S16 11.5 16 8a6 6 0 00-6-6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M11.73 17a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>
              {annOpen && (
                <div className={styles.annPanel}>
                  <div className={styles.annHead}>Comunicazioni</div>
                  <div className={styles.annEmpty}>Nessuna comunicazione</div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className={styles.dd} ref={userRef}>
              <button
                className={styles.userBtn}
                onClick={() => { setUserOpen(v => !v); setAnnOpen(false) }}
              >
                <span className={styles.avatar}>{displayName[0]?.toUpperCase() || '?'}</span>
                <span className={styles.userName}>{displayName}</span>
                <svg viewBox="0 0 10 10" fill="none" width={10} height={10}
                  style={{ transform: userOpen ? 'rotate(180deg)' : 'none', transition: '150ms' }}>
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {userOpen && (
                <div className={styles.userPanel}>
                  <div className={styles.userPanelInfo}>
                    <div className={styles.userPanelAvatar}>{displayName[0]?.toUpperCase() || '?'}</div>
                    <div>
                      <div className={styles.userPanelName}>{displayName}</div>
                      <div className={styles.userPanelEmail}>{user.email}</div>
                    </div>
                  </div>

                  {(user as any).company && (
                    <div className={styles.userPanelCompany}>{(user as any).company.name}</div>
                  )}

                  <div className={styles.userPanelDivider}/>

                  <Link href="/dashboard" className={styles.userPanelItem} onClick={() => setUserOpen(false)}>
                    <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
                      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
                      <rect x="7.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
                      <rect x="1" y="7.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
                      <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
                    </svg>
                    Dashboard
                  </Link>

                  <Link href="/catalog" className={styles.userPanelItem} onClick={() => setUserOpen(false)}>
                    <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
                      <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
                      <path d="M4 5h6M4 7.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                    Catalogo corsi
                  </Link>

                  <Link href="/newsroom" className={styles.userPanelItem} onClick={() => setUserOpen(false)}>
                    <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
                      <path d="M2 3h10v8H2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
                      <path d="M4 6h6M4 8.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                    Newsroom
                  </Link>

                  <div className={styles.userPanelDivider}/>

                  <Link href="/profile" className={styles.userPanelItem} onClick={() => setUserOpen(false)}>
                    <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
                      <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.1"/>
                      <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                    Il mio profilo
                  </Link>

                  <div className={styles.userPanelDivider}/>

                  <button className={styles.userPanelLogout} onClick={handleLogout}>
                    <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
                      <path d="M9 2h2a1 1 0 011 1v8a1 1 0 01-1 1H9M6 10l3-3-3-3M9 7H2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Esci
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {!isLoading && !user && (
          <Link href="/auth/login" className={styles.ctaBtn}>Accedi</Link>
        )}
      </div>
    </header>
  )
}
