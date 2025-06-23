export interface AppUser {
  name: string;
  id: number;
  email: string;
  googleId: string | null;
  facebookId: string | null;
  provider: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}