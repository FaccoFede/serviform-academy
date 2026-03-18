import Link from "next/link"

type Unit = {
  id: string
  title: string
  slug: string
  order: number
}

type Guide = {
  title: string
  url: string
}

type UnitData = {
  title: string
  slug: string
  order: number
  guide?: Guide
  course: {
    units: Unit[]
  }
}

async function getUnit(courseSlug: string, unitSlug: string): Promise<UnitData | null> {

  const res = await fetch(
    `http://localhost:3001/units/${courseSlug}/${unitSlug}`,
    { cache: "no-store" }
  )

  if (!res.ok) return null

  return res.json()
}

export default async function UnitPage({
  params
}: {
  params: Promise<{ slug: string; unit: string }>
}) {

  const { slug, unit } = await params

  const data = await getUnit(slug, unit)

  if (!data) {
    return <h1>Unit non trovata</h1>
  }

  return (

    <main style={{ display: "flex", height: "100vh" }}>

      {/* SIDEBAR */}
      <aside style={{
        width: "300px",
        borderRight: "1px solid #ddd",
        padding: "20px"
      }}>

        <h3>Lezioni</h3>

        <ul style={{ listStyle: "none", padding: 0 }}>

          {data.course.units.map(u => (

            <li key={u.id} style={{ marginBottom: "10px" }}>

              <Link href={`/courses/${slug}/${u.slug}`}>
                {u.order}. {u.title}
              </Link>

            </li>

          ))}

        </ul>

      </aside>

      {/* CONTENUTO */}
      <section style={{
        flex: 1,
        padding: "40px",
        overflow: "auto"
      }}>

        <h1>{data.title}</h1>

        {data.guide && (

          <div style={{ marginTop: "20px" }}>

            <a
              href={data.guide.url}
              target="_blank"
              style={{
                padding: "10px 20px",
                background: "#0070f3",
                color: "white",
                borderRadius: "6px",
                textDecoration: "none"
              }}
            >
              Apri guida tecnica
            </a>

          </div>

        )}

        <div style={{ marginTop: "40px" }}>

          <h3>Checklist</h3>

          <ul>

            <li>Installare il software</li>
            <li>Aprire EngView</li>
            <li>Creare il primo progetto</li>

          </ul>

        </div>

      </section>

    </main>

  )

}