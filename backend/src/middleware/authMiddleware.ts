import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppUser } from 'types/user';

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