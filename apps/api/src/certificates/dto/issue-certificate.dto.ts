import { IsString, IsUUID, Matches } from 'class-validator'

/**
 * DTO per l'emissione di un certificato.
 *
 * Il certificato viene emesso solo se l'utente ha completato
 * tutte le unità del corso (validazione nel service).
 */
export class IssueCertificateDto {

  @IsUUID('4', { message: 'userId deve essere un UUID valido' })
  userId: string

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'courseSlug deve essere un slug valido',
  })
  courseSlug: string
}
