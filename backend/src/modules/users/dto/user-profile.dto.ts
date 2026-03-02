export class UserProfileDto {
  id: string;

  username: string;

  name: string;

  email: string;

  avatarUrl: string | null;

  bio: string | null;

  createdAt: Date;

  updatedAt: Date;
}
