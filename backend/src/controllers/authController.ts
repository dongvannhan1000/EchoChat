import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import passport from 'passport';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(user);
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
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
    return res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email, avatar: user?.avatar }, token });
  })(req, res, next);
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({ message: 'Logout successful' });
    });
  });
};

export const refreshToken = (req: Request, res: Response) => {
  const token = req.body.token;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as { id: number };

    // Tạo token mới
    const newToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    return res.json({
      message: 'Token refreshed',
      token: newToken
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};
