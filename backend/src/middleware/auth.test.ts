import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorize, AuthRequest } from './auth';

jest.mock('jsonwebtoken');

const mockJwtVerify = jwt.verify as jest.Mock;

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
}

describe('authenticate middleware', () => {
  let req: Partial<AuthRequest>;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if no authorization header', () => {
    authenticate(req as AuthRequest, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header does not start with Bearer', () => {
    req.headers = { authorization: 'Basic abc123' };

    authenticate(req as AuthRequest, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    req.headers = { authorization: 'Bearer invalid-token' };
    mockJwtVerify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    authenticate(req as AuthRequest, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and set req.user if token is valid', () => {
    const payload = { id: 'user-1', email: 'test@example.com', role: 'parent' as const };
    req.headers = { authorization: 'Bearer valid-token' };
    mockJwtVerify.mockReturnValue(payload);

    authenticate(req as AuthRequest, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(payload);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('authorize middleware', () => {
  let req: Partial<AuthRequest>;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = mockResponse();
    next = jest.fn();
  });

  it('should return 403 if user has no role set', () => {
    req.user = undefined;
    const middleware = authorize('parent');

    middleware(req as AuthRequest, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user role is not in the allowed list', () => {
    req.user = { id: 'user-1', email: 'test@example.com', role: 'babysitter' };
    const middleware = authorize('parent');

    middleware(req as AuthRequest, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if user role is in the allowed list', () => {
    req.user = { id: 'user-1', email: 'test@example.com', role: 'parent' };
    const middleware = authorize('parent', 'babysitter');

    middleware(req as AuthRequest, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
