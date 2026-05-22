'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Building2,
  Users,
  Award,
  Calendar,
  Megaphone,
  ArrowUpRight,
  Plus,
} from 'lucide-react'
import { api } from '@/lib/api'
import PageHeader from './_components/PageHeader'
import styles from './AdminPage.module.css'

type Stats = {
  courses: { total: number; published: number; hidden: number }
  companies: number
  users: number
  certificates: number
  drafts: number
  upcomingEvents: any[]
  recentCourses: any[]
}

const COURSE_STATE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  PUBLISHED: { label: 'Pubblicato', color: '#065F46', bg: '#ECFDF5' },
  VISIBLE_LOCKED: { label: 'Bloccato', color: '#92400E', bg: '#FFFBEB' },
  HIDDEN: { label: 'Nascosto', color: 'var(--muted)', bg: 'var(--surface)' },
}

function fmtDateTime(d: string | Date) {
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtRelative(d: string | Date) {
  const date = new Date(d)
  const diff = Date.now() - date.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'adesso'
  if (min < 60) return `${min} min fa`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h fa`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}g fa`
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadStats() {
      try {
        const [courses, companies, users, certificates, announcements, events] = await Promise.all([
          api.courses.findAll().catch(() => []),
          api.companies.findAll().catch(() => []),
          api.users.findAll().catch(() => []),
          api.certificates.findAllAdmin().catch(() => []),
          api.announcements.findAll().catch(() => []),
          api.events.findAllAdmin().catch(() => []),
        ])
        if (!mounted) return
        const now = new Date()
        const upcoming = (events as any[])
          .filter(e => new Date(e.date).getTime() >= now.getTime())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 4)
        const recent = (courses as any[])
          .slice()
          .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
          .slice(0, 5)
        const draftsAnn = (announcements as any[]).filter(a => !a.published).length
        const draftsEv = (events as any[]).filter(e => !e.published).length
        setStats({
          courses: {
            total: (courses as any[]).length,
            published: (courses as any[]).filter(c => c.publishState === 'PUBLISHED').length,
            hidden: (courses as any[]).filter(c => c.publishState === 'HIDDEN').length,
          },
          companies: (companies as any[]).length,
          users: (users as any[]).length,
          certificates: (certificates as any[]).length,
          drafts: draftsAnn + draftsEv,
          upcomingEvents: upcoming,
          recentCourses: recent,
        })
      } catch {
        if (mounted) setStats(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadStats()
    return () => { mounted = false }
  }, [])

  return (
    <main className={styles.page}>
      <PageHeader
        title="Dashboard"
        description="Panoramica dello stato della piattaforma."
      />

      {/* KPI cards */}
      <section className={styles.kpiGrid}>
        <KpiCard
          href="/admin/courses"
          icon={BookOpen}
          label="Corsi"
          value={stats?.courses.total ?? '—'}
          hint={stats ? `${stats.courses.published} pubblicati · ${stats.courses.hidden} nascosti` : '—'}
          loading={loading}
          accent="ink"
        />
        <KpiCard
          href="/admin/companies"
          icon={Building2}
          label="Aziende"
          value={stats?.companies ?? '—'}
          hint="Anagrafica clienti"
          loading={loading}
          accent="blue"
        />
        <KpiCard
          href="/admin/users"
          icon={Users}
          label="Utenti"
          value={stats?.users ?? '—'}
          hint="Account registrati"
          loading={loading}
          accent="violet"
        />
        <KpiCard
          href="/admin/certificates"
          icon={Award}
          label="Certificati"
          value={stats?.certificates ?? '—'}
          hint="Emessi al completamento"
          loading={loading}
          accent="green"
        />
      </section>

      {/* Riga 1: corsi recenti + bozze */}
      <section className={styles.twoCol}>
        <div className={styles.card}>
          <header className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Ultimi corsi modificati</h2>
              <p className={styles.cardSubtitle}>Riprendi rapidamente il lavoro recente</p>
            </div>
            <Link href="/admin/courses" className={styles.cardLink}>
              Tutti i corsi <ArrowUpRight size={13} />
            </Link>
          </header>
          {loading ? (
            <div className={styles.cardEmpty}>Caricamento…</div>
          ) : stats && stats.recentCourses.length > 0 ? (
            <ul className={styles.list}>
              {stats.recentCourses.map(c => {
                const state = COURSE_STATE_LABEL[c.publishState] || COURSE_STATE_LABEL.HIDDEN
                return (
                  <li key={c.id}>
                    <Link href={`/admin/courses`} className={styles.listItem}>
                      <div className={styles.thumb}>
                        {c.thumbnailUrl
                          ? <img src={c.thumbnailUrl} alt="" />
                          : <BookOpen size={16} />}
                      </div>
                      <div className={styles.listBody}>
                        <div className={styles.listTitle}>{c.title}</div>
                        <div className={styles.listMeta}>
                          <span
                            className={styles.statePill}
                            style={{ background: state.bg, color: state.color }}
                          >
                            {state.label}
                          </span>
                          {c.software?.name && <span>{c.software.name}</span>}
                          {c.updatedAt && <span>·  {fmtRelative(c.updatedAt)}</span>}
                        </div>
                      </div>
                      <ArrowUpRight size={14} className={styles.listArrow} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className={styles.cardEmpty}>Nessun corso ancora.</div>
          )}
        </div>

        <div className={styles.card}>
          <header className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Da pubblicare</h2>
              <p className={styles.cardSubtitle}>
                {loading
                  ? '—'
                  : stats?.drafts
                    ? `${stats.drafts} ${stats.drafts === 1 ? 'bozza in attesa' : 'bozze in attesa'}`
                    : 'Nessuna bozza in sospeso'}
              </p>
            </div>
          </header>
          <div className={styles.draftBox}>
            <div className={styles.draftValue}>{loading ? '—' : (stats?.drafts ?? 0)}</div>
            <div className={styles.draftLabel}>
              Comunicazioni + eventi non pubblicati
            </div>
          </div>
          <Link href="/admin/announcements#announcements" className={styles.draftAction}>
            <Plus size={14} />
            Nuova comunicazione
          </Link>
          <Link href="/admin/announcements#events" className={styles.draftAction}>
            <Plus size={14} />
            Nuovo evento
          </Link>
        </div>
      </section>

      {/* Riga 2: prossimi eventi full-width */}
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Prossimi eventi</h2>
            <p className={styles.cardSubtitle}>
              {loading
                ? '—'
                : stats?.upcomingEvents.length
                  ? `${stats.upcomingEvents.length} in programma`
                  : 'Nessun evento futuro pianificato'}
            </p>
          </div>
          <Link href="/admin/announcements#events" className={styles.cardLink}>
            Tutti gli eventi <ArrowUpRight size={13} />
          </Link>
        </header>
        {loading ? (
          <div className={styles.cardEmpty}>Caricamento…</div>
        ) : stats && stats.upcomingEvents.length > 0 ? (
          <ul className={styles.eventGrid}>
            {stats.upcomingEvents.map(e => (
              <li key={e.id} className={styles.eventCard}>
                <div className={styles.eventDate}>
                  <span className={styles.eventDay}>
                    {new Date(e.date).toLocaleDateString('it-IT', { day: '2-digit' })}
                  </span>
                  <span className={styles.eventMonth}>
                    {new Date(e.date).toLocaleDateString('it-IT', { month: 'short' }).replace('.', '')}
                  </span>
                </div>
                <div className={styles.eventBody}>
                  <div className={styles.eventTitle}>{e.title}</div>
                  <div className={styles.eventMeta}>
                    <Calendar size={11} />
                    {fmtDateTime(e.date)}
                    {e.location && <span>· {e.location}</span>}
                  </div>
                  {!e.published && <span className={styles.draftPill}>Bozza</span>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.cardEmpty}>
            <Megaphone size={32} />
            <p>Nessun evento futuro programmato.</p>
            <Link href="/admin/announcements#events" className={styles.emptyAction}>
              <Plus size={14} />
              Nuovo evento
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}

function KpiCard({
  href, icon: Icon, label, value, hint, loading, accent,
}: {
  href: string
  icon: React.ComponentType<{ size?: number }>
  label: string
  value: number | string
  hint: string
  loading: boolean
  accent: 'ink' | 'blue' | 'violet' | 'green'
}) {
  return (
    <Link href={href} className={`${styles.kpi} ${styles[`kpiAccent_${accent}`]}`}>
      <div className={styles.kpiIcon}>
        <Icon size={16} />
      </div>
      <div className={styles.kpiBody}>
        <div className={styles.kpiLabel}>{label}</div>
        <div className={styles.kpiValue}>{loading ? '—' : value}</div>
        <div className={styles.kpiHint}>{hint}</div>
      </div>
      <ArrowUpRight size={14} className={styles.kpiArrow} />
    </Link>
  )
}
