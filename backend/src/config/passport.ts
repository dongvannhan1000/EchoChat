import passport from 'passport';
import jwtStrategy from './passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { googleStrategy } from './passport-oauth';
import { facebookStrategy } from './passport-oauth';

const prisma = new PrismaClient();

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        avatar: true
      }
    });
    if (!user) {
      return done(null, false, { message: 'Incorrect email.' });
    }
    if (!await bcrypt.compare(password, user.password)) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.use(jwtStrategy);
passport.use('google', googleStrategy);
passport.use('facebook', facebookStrategy);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;