import { IsString, Matches } from 'class-validator'

/**
 * DTO per l'emissione di un certificato.
 *
 * userId RIMOSSO — viene dedotto dal JWT nel controller.
 * Inviare userId dal client permetterebbe di emettere certificati per altri utenti.
 */
export class IssueCertificateDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'courseSlug deve essere un slug valido (es. engview-3d)',
  })
  courseSlug: string
}
