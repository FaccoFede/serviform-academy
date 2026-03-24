import Link from 'next/link'

/**
 * /admin/videos — DISABILITATA
 *
 * Sezione admin video pillole fuori scope.
 * (DOCX sez. 18, doc 02_scope)
 *
 * Non cancellato il file per mantenere la possibilità di ri-abilitazione.
 * Il modulo backend `videos` resta nel codice.
 */
export default function AdminVideosPage() {
  return (
    <div style={{ padding: '48px 80px', maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>
        Gestione video pillole
      </h1>
      <div
        style={{
          padding: '24px',
          borderRadius: 'var(--r)',
          borderLeft: '3px solid var(--muted)',
          background: 'var(--surface)',
          marginBottom: 24,
        }}
      >
        <p style={{ fontSize: 14, color: 'var(--body)' }}>
          Questa sezione è attualmente <strong>disabilitata</strong>.
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
          Le video pillole sono fuori dal perimetro di sviluppo corrente.
          Per riabilitarle in futuro, fare riferimento alla documentazione
          di progetto.
        </p>
      </div>
      <Link
        href="/admin"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--red)',
        }}
      >
        ← torna all&apos;admin
      </Link>
    </div>
  )
}
