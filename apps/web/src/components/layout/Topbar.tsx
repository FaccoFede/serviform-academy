'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import styles from './Topbar.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return <svg viewBox="0 0 24 24" fill="none" width={size} height={size} style={{flexShrink:0}}><path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

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
    { label: 'Dashboard',   href: '/dashboard' },
    { label: 'Catalogo',    href: '/catalog' },
    { label: 'Com. & Eventi', href: '/communications-events' },
  ] : [
    { label: 'Catalogo', href: '/catalog' },
  ]

  return (
    <header className={styles.bar}>
      <Link href={user ? '/dashboard' : '/'} className={styles.logoWrap}>
        <svg viewBox="0 0 32 34" fill="none" width={24} height={24}>
          <circle cx="16" cy="19" r="14" fill="#E63329"/>
          <circle cx="16" cy="21" r="6.5" fill="#000"/>
          <polygon points="16,0 10.5,15 21.5,15" fill="rgba(255,255,255,0.5)"/>
        </svg>
        <span className={styles.brand}>serviform <em>academy</em></span>
      </Link>

      <nav className={styles.nav}>
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className={[styles.navLink, isActive(item.href) ? styles.navActive : ''].join(' ')}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={styles.right}>
        <a href="https://support.serviform.com" target="_blank" rel="noopener"
          className={styles.iconBtn} title="Assistenza">
          <Icon d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </a>

        {!isLoading && user && (
          <>
            {/* Annunci dropdown */}
            <div className={styles.dd} ref={annRef}>
              <button className={styles.iconBtn} onClick={() => { setAnnOpen(v=>!v); setUserOpen(false) }}>
                <Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
              </button>
              {annOpen && (
                <div className={styles.annPanel}>
                  <div className={styles.annPanelHdr}>
                    <span>Comunicazione &amp; Eventi</span>
                    <Link href="/communications-events" className={styles.annPanelLink} onClick={()=>setAnnOpen(false)}>Vedi tutte</Link>
                  </div>
                  {announcements.length === 0 ? (
                    <div className={styles.annPanelEmpty}>Nessun annuncio disponibile.</div>
                  ) : announcements.slice(0, 5).map(a => (
                    <Link key={a.id} href="/communications-events" className={styles.annRow} onClick={()=>setAnnOpen(false)}>
                      <div className={styles.annDot} style={{ background: a.type==='NEW_COURSE'?'#E63329':a.type==='WEBINAR'?'#059669':'#067DB8' }}/>
                      <div>
                        <div className={styles.annRowTitle}>{a.title}</div>
                        {a.publishedAt && <div className={styles.annRowDate}>{new Date(a.publishedAt).toLocaleDateString('it-IT',{day:'2-digit',month:'short'})}</div>}
                      </div>
                    </Link>
                  ))}
                  <Link href="/communications-events" className={styles.annPanelFooter} onClick={()=>setAnnOpen(false)}>
                    Vai a Comunicazione &amp; Eventi →
                  </Link>
                </div>
              )}
            </div>

            {(user.role === 'ADMIN' || user.role === 'TEAM_ADMIN') && (
              <Link href="/admin" className={[styles.navLink, isActive('/admin') ? styles.navActive : ''].join(' ')}>Admin</Link>
            )}

            {/* User menu */}
            <div className={styles.dd} ref={userRef}>
              <button className={styles.userBtn} onClick={()=>{setUserOpen(v=>!v);setAnnOpen(false)}}>
                <span className={styles.avatar}>{displayName[0]?.toUpperCase()||'?'}</span>
                <span className={styles.userName}>{displayName}</span>
                <Icon d="M19 9l-7 7-7-7" size={10}/>
              </button>
              {userOpen && (
                <div className={styles.userPanel}>
                  <div className={styles.userPanelInfo}>
                    <div className={styles.userPanelAvatar}>{displayName[0]?.toUpperCase()||'?'}</div>
                    <div>
                      <div className={styles.userPanelName}>{displayName}</div>
                      <div className={styles.userPanelEmail}>{user.email}</div>
                    </div>
                  </div>
                  {user.company && <div className={styles.userPanelCo}>{user.company.name}</div>}
                  <div className={styles.userPanelDiv}/>
                  <Link href="/dashboard" className={styles.menuItem} onClick={()=>setUserOpen(false)}>
                    <Icon d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" size={14}/>Dashboard
                  </Link>
                  <Link href="/catalog" className={styles.menuItem} onClick={()=>setUserOpen(false)}>
                    <Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" size={14}/>Catalogo
                  </Link>
                  <Link href="/communications-events" className={styles.menuItem} onClick={()=>setUserOpen(false)}>
                    <Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" size={14}/>Com. &amp; Eventi
                  </Link>
                  <Link href="/profile" className={styles.menuItem} onClick={()=>setUserOpen(false)}>
                    <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" size={14}/>Il mio profilo
                  </Link>
                  <div className={styles.userPanelDiv}/>
                  <button className={styles.logoutBtn} onClick={handleLogout}>
                    <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={14}/>Esci
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
