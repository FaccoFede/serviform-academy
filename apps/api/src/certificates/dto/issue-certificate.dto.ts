import { IsString, Matches } from 'class-validator'
export class IssueCertificateDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) courseSlug: string
}
