import Link from 'next/link'

/**
 * Admin — pagina principale del backoffice.
 *
 * Stato Task 1:
 * - RIMOSSA: "Gestione video pillole" (doc 02_scope: videopillole fuori scope)
 * - Mantenute: software, corsi, unità
 *
 * Evoluzione prevista (Task 5-7):
 * - diventerà un vero portale gestionale con:
 *   aziende, utenti, assegnazioni, scadenze, annunci, import CSV
 * - layout admin dedicato con navigation laterale
 * - tabelle filtrabili e azioni massive
 */

const ADMIN_SECTIONS = [
  {
    label: 'Gestione software',
    href: '/admin/software',
    description: 'Famiglie software: EngView, Sysform, ProjectO, ServiformA',
  },
  {
    label: 'Gestione corsi',
    href: '/admin/courses',
    description: 'Catalogo corsi e metadati',
  },
  {
    label: 'Gestione unità',
    href: '/admin/units',
    description: 'Unità didattiche per ogni corso',
  },
  // RIMOSSO: { label: 'Gestione video pillole', href: '/admin/videos' }
  // Motivo: videopillole fuori scope (DOCX sez. 18, doc 02_scope)
]

export default function AdminPage() {
  return (
    <div style={{ padding: '48px 80px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>admin serviform academy.</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 40 }}>
        gestione contenuti della piattaforma.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ADMIN_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            style={{
              padding: '20px 24px',
              borderRadius: 'var(--r)',
              border: '1px solid var(--border)',
              transition: 'border-color 180ms ease',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
              {section.label}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              {section.description}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
