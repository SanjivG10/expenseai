import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { AuthenticationError, InvalidTokenError } from '../utils/errors';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    const user = await authService.verifyAccessToken(token);

    if (!user) {
      throw new InvalidTokenError('Invalid or expired access token');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = await authService.verifyAccessToken(token);
      req.user = user;
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors
    next();
  }
};