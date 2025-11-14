import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator'

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string

  rememberMe?: boolean
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string
}

export class SsoCallbackDto {
  @IsString()
  @IsNotEmpty()
  provider: string

  @IsString()
  @IsNotEmpty()
  code: string

  @IsString()
  @IsNotEmpty()
  state: string

  redirectUri?: string
}

export class SsoLinkDto {
  @IsString()
  @IsNotEmpty()
  provider: string

  @IsString()
  @IsNotEmpty()
  token: string
}

export class SsoUnlinkDto {
  @IsString()
  @IsNotEmpty()
  provider: string
}