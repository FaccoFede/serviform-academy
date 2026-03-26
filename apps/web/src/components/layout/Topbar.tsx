'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import styles from './Topbar.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [annOpen, setAnnOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const annRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  useEffect(() => {
    if (!user) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('sa_token') : null
    if (!token) return
    fetch(API_URL + '/announcements', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setAnnouncements(d || []))
      .catch(() => {})
  }, [user])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (annRef.current && !annRef.current.contains(e.target as Node)) setAnnOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function handleLogout() { logout(); router.push('/') }

  const displayName = user?.firstName || (user?.name || '').split(' ')[0] || user?.email?.split('@')[0] || ''
  const unread = announcements.length

  const navItems = user ? [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Catalogo', href: '/catalog' },
    { label: 'Newsroom', href: '/newsroom' },
  ] : [
    { label: 'Catalogo', href: '/catalog' },
  ]

  return (
    <header className={styles.bar}>
      {/* Logo */}
      <Link href={user ? '/dashboard' : '/'} className={styles.logoWrap}>
        <svg viewBox="0 0 32 34" fill="none" width={24} height={24}>
          <circle cx="16" cy="19" r="14" fill="#E63329"/>
          <circle cx="16" cy="21" r="6.5" fill="#000"/>
          <polygon points="16,0 10.5,15 21.5,15" fill="rgba(255,255,255,0.5)"/>
        </svg>
        <span className={styles.brand}>serviform <em>academy</em></span>
      </Link>

      {/* Nav */}
      <nav className={styles.nav}>
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className={[styles.navLink, isActive(item.href) ? styles.navActive : ''].join(' ')}>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right */}
      <div className={styles.right}>
        <a href="https://support.serviform.com" target="_blank" rel="noopener"
          className={styles.iconBtn} title="Assistenza Zendesk">
          <svg viewBox="0 0 16 16" fill="none" width={16} height={16}>
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M6 6.5a2 2 0 114 0c0 1-1 1.5-2 2M8 11.5v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </a>

        {!isLoading && user && (
          <>
            {/* Comunicazioni */}
            <Link href="/communications" className={styles.iconBtn} title="Comunicazioni">
              <svg viewBox="0 0 16 16" fill="none" width={16} height={16}>
                <path d="M3 5h10M3 8h7M3 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </Link>

            {/* Annunci dropdown */}
            <div className={styles.dd} ref={annRef}>
              <button className={styles.iconBtn} onClick={() => { setAnnOpen(v => !v); setUserOpen(false) }} title="Annunci">
                <svg viewBox="0 0 16 16" fill="none" width={16} height={16}>
                  <path d="M8 2a5.5 5.5 0 015.5 5.5c0 2.8-1.5 4.4-2 5H4.5c-.5-.6-2-2.2-2-5A5.5 5.5 0 018 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M6.5 12.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
              </button>

              {annOpen && (
                <div className={styles.annPanel}>
                  <div className={styles.annPanelHeader}>
                    <span>Novità e annunci</span>
                    <Link href="/communications" className={styles.annPanelLink} onClick={() => setAnnOpen(false)}>Vedi tutti</Link>
                  </div>
                  {announcements.length === 0 ? (
                    <div className={styles.annPanelEmpty}>
                      <svg viewBox="0 0 32 32" fill="none" width={24} height={24}><circle cx="16" cy="16" r="12" stroke="var(--border)" strokeWidth="1.5"/><path d="M12 16h8M16 12v8" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      Nessun annuncio
                    </div>
                  ) : announcements.slice(0, 5).map(a => (
                    <div key={a.id} className={styles.annItem}>
                      <div className={styles.annItemDot} data-type={a.type}/>
                      <div className={styles.annItemBody}>
                        <div className={styles.annItemTitle}>{a.title}</div>
                        <div className={styles.annItemText}>{a.body}</div>
                        {a.publishedAt && (
                          <div className={styles.annItemDate}>
                            {new Date(a.publishedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <Link href="/communications" className={styles.annPanelFooter} onClick={() => setAnnOpen(false)}>
                    Vedi tutte le comunicazioni →
                  </Link>
                </div>
              )}
            </div>

            {/* Admin */}
            {(user.role === 'ADMIN' || user.role === 'TEAM_ADMIN') && (
              <Link href="/admin" className={[styles.navLink, isActive('/admin') ? styles.navActive : ''].join(' ')}>
                Admin
              </Link>
            )}

            {/* User menu */}
            <div className={styles.dd} ref={userRef}>
              <button className={styles.userBtn} onClick={() => { setUserOpen(v => !v); setAnnOpen(false) }}>
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
                  {user.company && (
                    <div className={styles.userPanelCompany}>{user.company.name}</div>
                  )}
                  <div className={styles.userPanelDivider}/>
                  <Link href="/dashboard" className={styles.userPanelItem} onClick={() => setUserOpen(false)}>
                    <svg viewBox="0 0 14 14" fill="none" width={13} height={13}><rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.1"/><rect x="7.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.1"/><rect x="1" y="7.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.1"/><rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.1"/></svg>
                    Dashboard
                  </Link>
                  <Link href="/catalog" className={styles.userPanelItem} onClick={() => setUserOpen(false)}>
                    <svg viewBox="0 0 14 14" fill="none" width={13} height={13}><rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M4 5h6M4 7.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                    Catalogo corsi
                  </Link>
                  <Link href="/newsroom" className={styles.userPanelItem} onClick={() => setUserOpen(false)}>
                    <svg viewBox="0 0 14 14" fill="none" width={13} height={13}><path d="M2 3h10v8H2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/><path d="M4 6h6M4 8.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                    Newsroom
                  </Link>
                  <div className={styles.userPanelDivider}/>
                  <button className={styles.userPanelLogout} onClick={handleLogout}>
                    <svg viewBox="0 0 14 14" fill="none" width={13} height={13}><path d="M9 2h2a1 1 0 011 1v8a1 1 0 01-1 1H9M6 10l3-3-3-3M9 7H2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
