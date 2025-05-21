// src/types/express/index.d.ts
import { AppUser} from '../user';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AppUser;
  }
}
