import { IsString, IsInt, IsUUID } from 'class-validator'

export class CreateUnitDto {

  @IsString()
  title: string

  @IsInt()
  order: number

  @IsUUID()
  courseId: string

}