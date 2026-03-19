import { IsEmail, IsString, IsOptional, MinLength, MaxLength } from 'class-validator'

export class RegisterDto {
  @IsEmail({}, { message: 'Email non valida' })
  email: string

  @IsString()
  @MinLength(6, { message: 'La password deve avere almeno 6 caratteri' })
  @MaxLength(100)
  password: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string
}
