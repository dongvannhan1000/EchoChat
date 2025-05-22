import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { IPrisma } from '@quixo3/prisma-session-store/dist/@types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sessionMiddleware = session({
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000 // ms
  },
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: process.env.NODE_ENV === 'test' 
    ? undefined 
    : new PrismaSessionStore(
        prisma as unknown as IPrisma<'session'>,
        {
          checkPeriod: 2 * 60 * 1000,  // ms
          dbRecordIdIsSessionId: true,
          dbRecordIdFunction: undefined
        }
      )
});