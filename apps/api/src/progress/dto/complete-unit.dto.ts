import { IsUUID } from 'class-validator'

/**
 * DTO per segnare un'unità come completata.
 *
 * userId RIMOSSO — viene dedotto dal JWT nel controller.
 * Inviare userId dal client è un buco di sicurezza: un utente potrebbe
 * marcare il progresso di un altro utente.
 */
export class CompleteUnitDto {
  @IsUUID('4', { message: 'unitId deve essere un UUID valido' })
  unitId: string
}
