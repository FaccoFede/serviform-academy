import { IsUUID } from 'class-validator'
export class CompleteUnitDto {
  @IsUUID('4') unitId: string
}
