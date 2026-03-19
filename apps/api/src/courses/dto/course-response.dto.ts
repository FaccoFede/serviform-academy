/**
 * DTO di risposta per un corso.
 * Definisce la forma dei dati restituiti dalle API.
 */
export class CourseResponseDto {
  id: string
  title: string
  slug: string
  description?: string
  softwareId: string
  createdAt: Date

  software?: {
    id: string
    name: string
    slug: string
  }

  units?: {
    id: string
    title: string
    slug: string
    order: number
  }[]
}
