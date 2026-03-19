import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator'

/**
 * DTO per la creazione di una video pillola.
 *
 * Le video pillole sono contenuti brevi legati a un software specifico.
 * Il youtubeId è l'identificativo del video su YouTube (es. "zt4aT5oKLII").
 */
export class CreateVideoPillDto {

  @IsString()
  @MinLength(3, { message: 'Il titolo deve avere almeno 3 caratteri' })
  @MaxLength(150, { message: 'Il titolo non può superare 150 caratteri' })
  title: string

  @IsString()
  @MinLength(5, { message: 'youtubeId non valido' })
  @MaxLength(20, { message: 'youtubeId non valido' })
  youtubeId: string

  @IsUUID('4', { message: 'softwareId deve essere un UUID valido' })
  softwareId: string

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La descrizione non può superare 500 caratteri' })
  description?: string
}
