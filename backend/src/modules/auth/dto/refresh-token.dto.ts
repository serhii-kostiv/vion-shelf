import { IsString, MinLength } from 'class-validator';

/**
 * DTO for refresh token request
 */
export class RefreshTokenDto {
  @IsString()
  @MinLength(1, { message: 'Refresh token is required' })
  refreshToken: string;
}
