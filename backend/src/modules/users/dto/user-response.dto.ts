import { Exclude, Expose } from 'class-transformer';

/**
 * DTO for user responses
 * Excludes sensitive fields (password, refreshTokens)
 */
@Exclude()
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  username: string;

  @Expose()
  name?: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // password and refreshTokens are excluded by default due to @Exclude() on class

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
