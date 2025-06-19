import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { IPrisma } from '@quixo3/prisma-session-store/dist/@types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const prismaTyped: IPrisma<'Session'> = prisma as any;

export const sessionMiddleware = session({
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000 // ms
  },
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: process.env.NODE_ENV === 'test'
    ? undefined
    : new PrismaSessionStore(prismaTyped, {
        checkPeriod: 2 * 60 * 1000, // Clean up expired sessions every 2 min
        dbRecordIdIsSessionId: true,
        sessionModelName: 'Session' // <-- Rất quan trọng nè!
      }),
});