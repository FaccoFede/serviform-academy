import { IsString, IsUUID, IsUrl, MinLength, MaxLength } from 'class-validator'

/**
 * DTO per la creazione di un riferimento guida Zendesk.
 *
 * Ogni unit può avere al massimo una guida collegata (relazione 1:1).
 * L'URL punta alla guida su support.serviform.com.
 */
export class CreateGuideDto {

  @IsString()
  @MinLength(1)
  zendeskId: string

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string

  @IsUrl({}, { message: 'URL della guida non valido' })
  url: string

  @IsUUID('4', { message: 'unitId deve essere un UUID valido' })
  unitId: string
}
