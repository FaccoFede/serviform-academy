import { IsUUID } from 'class-validator'

/**
 * DTO per segnare un'unità come completata.
 *
 * Richiede userId e unitId validi.
 * Il servizio gestisce l'upsert per evitare duplicati.
 */
export class CompleteUnitDto {

  @IsUUID('4', { message: 'userId deve essere un UUID valido' })
  userId: string

  @IsUUID('4', { message: 'unitId deve essere un UUID valido' })
  unitId: string
}
