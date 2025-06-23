import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as authService from '../services/authService';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { generateTokens } from '../config/token';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your_refresh_secret';
const ACCESS_TOKEN_EXPIRES = '15m'; 

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.register(req.body);
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({ 
      message: 'Register successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
};
export const login = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(400).json({ message: 'Login fail', info });
    }
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const { password, ...userWithoutPassword } = user;

    return res.json({ 
      message: 'Login successfully', 
      user: userWithoutPassword, 
      accessToken 
    });
  })(req, res, next);
};



export const logout = (req: Request, res: Response, next: NextFunction) => {
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logout successful' });
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: number };

    const user = await authService.getUserById(decoded.id);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Create new token
    const accessToken = jwt.sign(
      { id: decoded.id },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );

    const { password, ...userWithoutPassword } = user;

    res.json({
      message: 'Token refreshed',
      accessToken,
      user: userWithoutPassword
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Token is not valid' });
      return;
    }
    next(error);
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    
    const user = await authService.getUserById(decoded.id);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    
    const { password, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Token is not valid' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
