import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your_refresh_secret';

export const generateAccessToken = (userId: number) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '15m' });
  };
  
  export const generateRefreshToken = (userId: number) => {
    return jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: '7d' });
  };
  
  export const generateTokens = (userId: number) => {
    return {
      accessToken: generateAccessToken(userId),
      refreshToken: generateRefreshToken(userId)
    };
  };
  