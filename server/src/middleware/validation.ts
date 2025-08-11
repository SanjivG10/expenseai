import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../types/api';

type ValidationType = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, type: ValidationType = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let data: any;

      switch (type) {
        case 'body':
          data = req.body;
          break;
        case 'query':
          data = req.query;
          break;
        case 'params':
          data = req.params;
          break;
        default:
          data = req.body;
      }

      const validatedData = schema.parse(data);

      // Replace the original data with validated data
      switch (type) {
        case 'body':
          req.body = validatedData;
          break;
        case 'query':
          req.query = validatedData;
          break;
        case 'params':
          req.params = validatedData;
          break;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Create detailed validation error information
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.') || 'root',
          message: err.message,
          code: err.code,
        }));

        // Log detailed validation error for debugging
        console.error('🚫 [VALIDATION ERROR]', {
          timestamp: new Date().toISOString(),
          endpoint: `${req.method} ${req.originalUrl}`,
          validationType: type,
          receivedData: req.body,
          validationErrors,
          errorCount: error.errors.length,
        });

        const errorMessage = validationErrors
          .map((err) => `${err.field}: ${err.message}`)
          .join(', ');

        const apiError: ApiError = {
          success: false,
          message: `Validation failed: ${errorMessage}`,
          error: {
            type: 'VALIDATION_ERROR',
            details: validationErrors,
            receivedData: req.body,
            field: type,
          },
          status: 400,
        };

        res.status(400).json(apiError);
        return;
      }

      // Handle other validation errors
      console.error('🚫 [UNKNOWN VALIDATION ERROR]', {
        timestamp: new Date().toISOString(),
        endpoint: `${req.method} ${req.originalUrl}`,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      const apiError: ApiError = {
        success: false,
        message: 'Validation failed',
        error: {
          type: 'UNKNOWN_VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown validation error',
        },
        status: 400,
      };

      res.status(400).json(apiError);
      return;
    }
  };
};

export default validate;
