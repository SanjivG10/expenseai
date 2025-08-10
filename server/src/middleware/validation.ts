import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../types/api';

type ValidationType = 'body' | 'query' | 'params';

export const validate = (
  schema: ZodSchema,
  type: ValidationType = 'body'
) => {
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
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        const apiError: ApiError = {
          success: false,
          message: 'Validation failed',
          error: JSON.stringify(errorMessages),
          status: 400
        };

        res.status(400).json(apiError);
        return;
      }

      // Handle other validation errors
      const apiError: ApiError = {
        success: false,
        message: 'Validation failed',
        error: error instanceof Error ? error.message : 'Unknown validation error',
        status: 400
      };

      res.status(400).json(apiError);
      return;
    }
  };
};

export default validate;