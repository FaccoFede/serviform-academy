import { IsString, MinLength, MaxLength, Matches } from 'class-validator'

/**
 * DTO per la creazione di un software.
 *
 * I tre software attuali: EngView, Sysform, ProjectO.
 * Lo slug viene usato per filtrare corsi e video pillole.
 */
export class CreateSoftwareDto {

  @IsString()
  @MinLength(2, { message: 'Il nome deve avere almeno 2 caratteri' })
  @MaxLength(50, { message: 'Il nome non può superare 50 caratteri' })
  name: string

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Lo slug deve essere lowercase con trattini (es. engview)',
  })
  slug: string
}
