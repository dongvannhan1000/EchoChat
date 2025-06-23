import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppUser } from 'types/user';
import passport from '../config/passport';

export const isAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ msg: 'You are not authorized to view this resource' });
      return;
    };
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded as AppUser;
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Token is not valid' });
    return;
  }
};

export const authenticateGoogle = passport.authenticate('google', { 
  scope: ['profile', 'email'] 
});

export const authenticateGoogleCallback = passport.authenticate('google', { 
  failureRedirect: '/login?error=oauth_failed' 
});

export const authenticateFacebook = passport.authenticate('facebook', { 
  scope: ['email'] 
});

export const authenticateFacebookCallback = passport.authenticate('facebook', { 
  failureRedirect: '/login?error=oauth_failed' 
});

export const authenticateJWT = passport.authenticate('jwt', { 
  session: false 
});
