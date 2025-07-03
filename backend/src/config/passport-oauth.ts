import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log("!!! Reading GOOGLE_CALLBACK_URL from env:", process.env.GOOGLE_CALLBACK_URL);
console.log("!!! Reading FACEBOOK_CALLBACK_URL from env:", process.env.FACEBOOK_CALLBACK_URL);

// Google OAuth Strategy
export const googleStrategy = new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth profile:', profile);
  
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { googleId: profile.id },
              { email: profile.emails?.[0]?.value }
            ]
          }
        });
  
        if (user) {
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { 
                googleId: profile.id,
              }
            });
          }
          return done(null, user);
        }
  
        // Tạo user mới
        const newUser = await prisma.user.create({
          data: {
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName || '',
            googleId: profile.id,
            emailVerified: true,
            password: '',
            provider: 'google'
          }
        });
  
        return done(null, newUser);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, false);
      }
    }
  );
  
  // Facebook OAuth Strategy
  export const facebookStrategy = new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'photos', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Facebook OAuth profile:', profile);
  
        // Kiểm tra user đã tồn tại với Facebook ID
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { facebookId: profile.id },
              { email: profile.emails?.[0]?.value }
            ]
          }
        });
  
        if (user) {
          // Nếu user đã tồn tại nhưng chưa có Facebook ID, cập nhật
          if (!user.facebookId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { 
                facebookId: profile.id,
              }
            });
          }
          return done(null, user);
        }
  
        // Tạo user mới
        const newUser = await prisma.user.create({
          data: {
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName || '',
            facebookId: profile.id,
            emailVerified: true,
            password: '',
            provider: 'facebook'
          }
        });
  
        return done(null, newUser);
      } catch (error) {
        console.error('Facebook OAuth error:', error);
        return done(error, false);
      }
    }
  );