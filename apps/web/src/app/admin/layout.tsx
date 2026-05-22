'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  ClipboardList,
  Tag,
  Video,
  FileText,
  Building2,
  Users,
  Link2,
  Megaphone,
  Calendar,
  Award,
  Upload,
  ChevronsLeft,
  ChevronsRight,
  Menu,
} from 'lucide-react'
import styles from './AdminLayout.module.css'

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number }>; match?: string }

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Generale',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, match: '/admin' },
    ],
  },
  {
    group: 'Contenuti',
    items: [
      { href: '/admin/courses', label: 'Corsi', icon: BookOpen },
      { href: '/admin/units', label: 'Unità', icon: Layers },
      { href: '/admin/exercises', label: 'Esercitazioni', icon: ClipboardList },
      { href: '/admin/software', label: 'Categorie', icon: Tag },
    ],
  },
  {
    group: 'Librerie',
    items: [
      { href: '/admin/videos', label: 'Catalogo Video', icon: Video },
      { href: '/admin/guides', label: 'Catalogo Guide', icon: FileText },
    ],
  },
  {
    group: 'Organizzazione',
    items: [
      { href: '/admin/companies', label: 'Aziende', icon: Building2 },
      { href: '/admin/users', label: 'Utenti', icon: Users },
      { href: '/admin/assignments', label: 'Assegnazioni', icon: Link2 },
    ],
  },
  {
    group: 'Comunicazioni',
    items: [
      { href: '/admin/announcements#announcements', label: 'Comunicazioni', icon: Megaphone, match: '/admin/announcements' },
      { href: '/admin/announcements#events', label: 'Eventi', icon: Calendar, match: '/admin/announcements' },
    ],
  },
  {
    group: 'Progressi',
    items: [
      { href: '/admin/certificates', label: 'Certificazioni', icon: Award },
      { href: '/admin/imports', label: 'Import CSV', icon: Upload },
    ],
  },
]

const SIDEBAR_KEY = 'sa_admin_sidebar_collapsed'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(SIDEBAR_KEY) : null
    if (saved === '1') setCollapsed(true)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try { window.localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0') } catch {}
  }, [collapsed, hydrated])

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }
    if (user.role !== 'ADMIN' && user.role !== 'TEAM_ADMIN') {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (isLoading) return (
    <div style={{ padding: 80, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
      Verifica accesso...
    </div>
  )

  if (!user || (user.role !== 'ADMIN' && user.role !== 'TEAM_ADMIN')) return null

  function isActive(item: NavItem) {
    const match = item.match ?? item.href
    if (match === '/admin') return pathname === '/admin'
    return pathname?.startsWith(match) ?? false
  }

  return (
    <div className={`${styles.shell} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
      {mobileOpen && <div className={styles.mobileBackdrop} onClick={() => setMobileOpen(false)} />}

      <aside className={styles.sidebar} aria-label="Navigazione admin">
        <div className={styles.sidebarHead}>
          <span className={styles.sidebarTag}>Admin</span>
          <button
            type="button"
            className={styles.collapseTopBtn}
            onClick={() => setCollapsed(v => !v)}
            aria-label={collapsed ? 'Espandi menu' : 'Comprimi menu'}
            title={collapsed ? 'Espandi menu' : 'Comprimi menu'}
          >
            {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV.map((group) => (
            <div key={group.group} className={styles.group}>
              <span className={styles.groupLabel}>{group.group}</span>
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={16} />
                    <span className={styles.navLabel}>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>

      <main className={styles.content}>
        <button
          type="button"
          className={styles.mobileTrigger}
          onClick={() => setMobileOpen(true)}
          aria-label="Apri menu"
        >
          <Menu size={16} />
          <span>Menu admin</span>
        </button>
        {children}
      </main>
    </div>
  )
}
