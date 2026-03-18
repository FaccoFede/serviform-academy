import Link from "next/link"

async function getCourses() {
  const res = await fetch("http://localhost:3001/courses", { cache: "no-store" })
  return res.json()
}

export default async function HomePage() {

  const courses = await getCourses()

  return (

    <main style={{ padding: "40px" }}>

      <h1>Serviform Academy</h1>

      <h2 style={{ marginTop: "40px" }}>
        Corsi
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: "20px",
        marginTop: "20px"
      }}>

        {courses.map((course: any) => (

          <Link
            key={course.id}
            href={`/courses/${course.slug}`}
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              borderRadius: "8px",
              textDecoration: "none",
              color: "black"
            }}
          >

            <h3>{course.title}</h3>

            <p>{course.software.name}</p>

          </Link>

        ))}

      </div>

      <div style={{ marginTop: "60px" }}>

        <Link href="/videos">
          Vai alle Video Pillole →
        </Link>

      </div>

    </main>

  )

}