import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator'

/**
 * DTO per l'import di una video pillola da fonte esterna (es. YouTube).
 *
 * Usa softwareSlug invece di softwareId per comodità di integrazione.
 * Il service risolve lo slug nell'ID corrispondente.
 */
export class ImportVideoPillDto {

  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title: string

  @IsString()
  @MinLength(5)
  @MaxLength(20)
  youtubeId: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'softwareSlug deve essere un slug valido',
  })
  softwareSlug: string
}
