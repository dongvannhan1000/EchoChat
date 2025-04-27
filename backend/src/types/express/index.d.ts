// src/types/express/index.d.ts
import type { User as AppUser } from '../user';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AppUser;
  }
}
