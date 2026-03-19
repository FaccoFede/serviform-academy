import { NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params

  const res = await fetch(
    `http://localhost:3001/courses/${slug}`,
    { cache: 'no-store' }
  )

  const data = await res.json()

  return Response.json(data)
}