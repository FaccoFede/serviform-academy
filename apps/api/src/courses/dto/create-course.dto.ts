import { IsString, IsOptional, IsUUID, MinLength, MaxLength, Matches } from 'class-validator'

/**
 * DTO per la creazione di un nuovo corso.
 *
 * Validazioni:
 * - title: stringa obbligatoria, min 3 / max 120 caratteri
 * - slug: stringa obbligatoria, formato URL-safe (lowercase, hyphens)
 * - description: stringa opzionale, max 500 caratteri
 * - softwareId: UUID valido obbligatorio (riferimento a Software)
 */
export class CreateCourseDto {

  @IsString()
  @MinLength(3, { message: 'Il titolo deve avere almeno 3 caratteri' })
  @MaxLength(120, { message: 'Il titolo non può superare 120 caratteri' })
  title: string

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Lo slug deve essere lowercase con trattini (es. modulo-3d)',
  })
  slug: string

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La descrizione non può superare 500 caratteri' })
  description?: string

  @IsUUID('4', { message: 'softwareId deve essere un UUID valido' })
  softwareId: string
}
