import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @IsEmail({}, { message: 'Email non valida' })
  email: string

  @IsString()
  @MinLength(6, { message: 'La password deve avere almeno 6 caratteri' })
  password: string
}
