import { NextFunction, Request, Response } from 'express';
import env from '../config/env';
import { AppError } from '../utils/errors';

interface ErrorResponse {
  success: false;
  message: string;
  code: string;
  details?: any;
  stack?: string;
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle operational errors (known errors)
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      message: error.message,
      code: error.code,
    };

    // Include details in development
    if (env.NODE_ENV === 'development' && error.details) {
      response.details = error.details;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle Joi validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: error.message,
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  // Handle MongoDB/Database errors
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    res.status(500).json({
      success: false,
      message: 'Database error occurred',
      code: 'DATABASE_ERROR',
    });
    return;
  }

  // Handle unexpected errors
  const response: ErrorResponse = {
    success: false,
    message: env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
  };

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    response.stack = error.stack || '';
  }

  res.status(500).json(response);
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

// Global error handlers
export const handleUncaughtExceptions = (): void => {
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
};
