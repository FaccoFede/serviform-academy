import Link from 'next/link'
import { apiFetch } from '@/lib/api'

/**
 * Homepage — pagina pubblica.
 *
 * Stato Task 1:
 * - videopillole RIMOSSE dalla navigazione
 * - pricing/consulting NON presenti (mai stati nel repo originale)
 * - API URL centralizzato via lib/api.ts
 *
 * Evoluzione prevista (Task 4):
 * - questa diventerà la vera homepage pubblica/prefiltro
 * - verrà affiancata da una dashboard post-login separata
 * - verranno aggiunte statistiche, CTA commerciali, preview bloccate
 */

type Course = {
  id: string
  title: string
  slug: string
  description?: string
  software: { name: string; slug: string }
}

async function getCourses(): Promise<Course[]> {
  try {
    return await apiFetch<Course[]>('/courses')
  } catch {
    return []
  }
}

export default async function HomePage() {
  const courses = await getCourses()

  return (
    <div style={{ padding: '48px 80px', maxWidth: 1100 }}>
      <h1 style={{ fontSize: 36, letterSpacing: '-1.2px', marginBottom: 8 }}>
        serviform academy.
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, marginBottom: 48 }}>
        piattaforma di formazione per EngView, Sysform, ProjectO e ServiformA.
      </p>

      <h2 style={{ fontSize: 22, marginBottom: 24 }}>moduli disponibili</h2>

      {courses.length === 0 ? (
        <p style={{ color: 'var(--muted)', padding: '60px 0', textAlign: 'center' }}>
          nessun modulo disponibile al momento.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              style={{
                padding: 28,
                borderRadius: 'var(--r-lg)',
                border: '1px solid var(--border)',
                transition: 'box-shadow 250ms ease, transform 250ms ease',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.6px',
                  color: 'var(--muted)',
                }}
              >
                {course.software.name}
              </span>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginTop: 8,
                  color: 'var(--ink)',
                }}
              >
                {course.title}
              </h3>
              {course.description && (
                <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>
                  {course.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* RIMOSSO: link "Vai alle Video Pillole →" (doc 02_scope: videopillole fuori scope) */}
    </div>
  )
}
