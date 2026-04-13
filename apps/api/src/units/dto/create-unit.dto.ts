import { IsString, IsUUID, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator'

/**
 * DTO creazione unità.
 *
 * Note:
 *  - `order` NON è più accettato dal client: lo calcola il service
 *    (OVERVIEW → 0, altrimenti max+1).
 *  - `duration` (stringa) viene costruita dal service a partire da
 *    `durationHours` e `durationMinutes`: l'admin non scrive mai l'unità
 *    di misura a mano.
 *  - `slug` è opzionale; se mancante viene generato dal titolo.
 */
export class CreateUnitDto {
  @IsString()
  title: string

  @IsUUID()
  courseId: string

  @IsOptional()
  @IsString()
  @IsIn(['OVERVIEW', 'LESSON', 'EXERCISE'])
  unitType?: string

  @IsOptional()
  @IsString()
  subtitle?: string

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsString()
  videoUrl?: string

  @IsOptional()
  @IsString()
  slug?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  durationHours?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(59)
  durationMinutes?: number
}
