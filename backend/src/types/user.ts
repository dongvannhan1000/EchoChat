export interface User {
  id: number; 
  name: string;
  email: string;
  password: string;
  avatar?: string;
  block: [];
  statusMessage?: string;
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
}