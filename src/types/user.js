export interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
}

export interface AuthUser extends UserProfile {
  email?: string;
}
