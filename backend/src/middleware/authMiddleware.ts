import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from 'types/user';

export interface AuthenticatedRequest extends Request {
  user?: User
}

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ msg: 'You are not authorized to view this resource' });
    };
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};