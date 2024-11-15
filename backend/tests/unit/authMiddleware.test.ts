// tests/unit/authMiddleware.test.ts
import { isAuth } from '../../src/middleware/authMiddleware';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should pass with valid token', () => {
    const mockUser = { id: 1 };
    mockReq.headers = {
      authorization: 'Bearer valid-token',
    };
    (jwt.verify as jest.Mock).mockReturnValue(mockUser);

    isAuth(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockReq.user).toEqual(mockUser);
  });

  it('should return 401 when no token provided', () => {
    isAuth(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      msg: 'You are not authorized to view this resource',
    });
  });
});