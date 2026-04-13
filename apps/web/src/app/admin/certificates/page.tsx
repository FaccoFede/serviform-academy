'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from '../AdminPage.module.css'
import t from '../table.module.css'

/**
 * Admin Certificazioni / Badge.
 *
 * Emissione automatica:
 *  • Quando l'utente completa tutte le unità non-OVERVIEW di un corso,
 *    il backend emette (idempotentemente) un certificato se
 *    `course.issuesBadge = true`.
 *  • L'admin può anche revocare certificati singolarmente.
 *
 * Questa pagina mostra solo i certificati GIÀ EMESSI — non consente
 * emissione manuale, che resterebbe incoerente con la regola "solo
 * corsi effettivamente completati".
 */
export default function AdminCertificatesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.certificates.findAllAdmin()
      setRows(data as any[])
    } catch {
      setRows([])
    }
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const revoke = async (id: string, who: string, what: string) => {
    if (!confirm(`Revocare il certificato di ${who} per "${what}"?`)) return
    try {
      await api.certificates.revoke(id)
      setMsg({ text: 'Certificato revocato.', ok: true })
      load()
    } catch (e: any) {
      setMsg({ text: e.message, ok: false })
    }
  }

  const filtered = rows.filter((r) => {
    const who = (r.user?.name || r.user?.email || '').toLowerCase()
    const course = (r.course?.title || '').toLowerCase()
    return who.includes(q.toLowerCase()) || course.includes(q.toLowerCase())
  })

  return (
    <main className={styles.main}>
      <div className={t.hdr}>
        <div>
          <Link href="/admin" className={t.back}>← Admin</Link>
          <h1 className={styles.title}>Certificazioni</h1>
          <p className={styles.desc}>
            {rows.length} certificati emessi automaticamente al completamento dei corsi
          </p>
        </div>
      </div>

      {msg && (
        <div className={msg.ok ? t.ok : t.err}>
          {msg.text}
          <button onClick={() => setMsg(null)}>×</button>
        </div>
      )}

      <div
        style={{
          background: '#F0F9FF',
          border: '1px solid #BAE6FD',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 20,
          fontSize: 12,
          color: '#075985',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: '#0C4A6E' }}>Come funzionano i badge:</strong>{' '}
        ogni corso ha un flag <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 4 }}>issuesBadge</code>.
        Quando un utente completa tutte le unità (escluse le Overview), il sistema emette
        automaticamente un badge. Il badge è idempotente (uno solo per coppia utente/corso) e
        compare nel profilo utente.
      </div>

      <input
        className={t.search}
        placeholder="Cerca per utente o corso…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loading ? (
        <p>Caricamento…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
          <p>Nessun certificato emesso.</p>
        </div>
      ) : (
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead>
              <tr>
                <th>Utente</th>
                <th>Corso</th>
                <th>Software</th>
                <th>Emesso il</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => {
                const name =
                  r.user?.name ||
                  [r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ') ||
                  r.user?.email ||
                  '—'
                return (
                  <tr key={r.id}>
                    <td className={t.tdBold}>
                      {name}
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400, fontFamily: 'var(--font-mono)' }}>
                        {r.user?.email}
                      </div>
                    </td>
                    <td>{r.course?.title || '—'}</td>
                    <td>
                      {r.course?.software ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 100,
                            background: r.course.software.lightColor || 'var(--surface)',
                            color: r.course.software.color || 'var(--ink)',
                            fontSize: 10,
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {r.course.software.name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {new Date(r.issuedAt).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className={t.actions}>
                      <button className={t.btnD} onClick={() => revoke(r.id, name, r.course?.title || '')}>
                        Revoca
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
