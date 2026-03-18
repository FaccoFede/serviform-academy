export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {

  const res = await fetch(
    `http://localhost:3001/courses/${params.slug}`
  )

  const data = await res.json()

  return Response.json(data)

}