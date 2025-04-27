import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`\n[${req.method} ${req.originalUrl}]`);
  console.error(err.stack || err);
  
  const status = err.statusCode || 500;
  
  res.status(status).json({
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};