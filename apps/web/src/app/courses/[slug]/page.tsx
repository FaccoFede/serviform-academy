import Link from "next/link"

type Unit = {
  id: string
  title: string
  slug: string
  order: number
}

type Course = {
  id: string
  title: string
  description?: string
  slug: string
  software: {
    name: string
  }
  units: Unit[]
}

async function getCourse(slug: string): Promise<Course | null> {

  const res = await fetch(
    `http://localhost:3001/courses/${slug}`,
    { cache: "no-store" }
  )

  if (!res.ok) return null

  return res.json()
}

export default async function CoursePage({
  params
}: {
  params: Promise<{ slug: string }>
}) {

  const { slug } = await params

  const course = await getCourse(slug)

  if (!course) {
    return <h1>Corso non trovato</h1>
  }

  return (

    <main style={{ padding: "40px" }}>

      <h1>{course.title}</h1>

      <p>{course.description}</p>

      <h2 style={{ marginTop: "40px" }}>
        Unità del corso
      </h2>

      <ul style={{ marginTop: "20px" }}>

        {course.units.map(unit => (

          <li key={unit.id} style={{ marginBottom: "10px" }}>

            <Link href={`/courses/${slug}/${unit.slug}`}>
              {unit.order}. {unit.title}
            </Link>

          </li>

        ))}

      </ul>

    </main>

  )

}