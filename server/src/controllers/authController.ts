import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import {
  validateSchema,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  updateProfileSchema,
} from '../utils/validation';
import { AppError, ValidationError } from '../utils/errors';

export class AuthController {
  // User signup
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateSchema(signupSchema, req.body);

      const result = await authService.signup(validatedData);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Validation failed')) {
        next(new ValidationError(error.message));
      } else {
        next(error);
      }
    }
  }

  // User login
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateSchema(loginSchema, req.body);

      const result = await authService.login(validatedData);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Validation failed')) {
        next(new ValidationError(error.message));
      } else {
        next(error);
      }
    }
  }

  // Forgot password - send OTP
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateSchema(forgotPasswordSchema, req.body);

      await authService.forgotPassword(validatedData.email);

      res.json({
        success: true,
        message: 'Password reset OTP sent to your email',
        data: null,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Validation failed')) {
        next(new ValidationError(error.message));
      } else {
        next(error);
      }
    }
  }

  // Reset password with OTP (combined endpoint)
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateSchema(resetPasswordSchema, req.body);

      await authService.resetPasswordWithOTP(
        validatedData.email,
        validatedData.otp,
        validatedData.password
      );

      res.json({
        success: true,
        message: 'Password reset successful',
        data: null,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Validation failed')) {
        next(new ValidationError(error.message));
      } else {
        next(error);
      }
    }
  }

  // Refresh access token
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateSchema(refreshTokenSchema, req.body);

      const tokens = await authService.refreshToken(validatedData.refreshToken);

      res.json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Validation failed')) {
        next(new ValidationError(error.message));
      } else {
        next(error);
      }
    }
  }

  // Logout user
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateSchema(refreshTokenSchema, req.body);

      await authService.logout(validatedData.refreshToken);

      res.json({
        success: true,
        message: 'Logout successful',
        data: null,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Validation failed')) {
        next(new ValidationError(error.message));
      } else {
        next(error);
      }
    }
  }

  // Get current user profile
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user; // Set by auth middleware

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateSchema(updateProfileSchema, req.body);
      const user = (req as any).user;

      const updatedUser = await authService.updateProfile(user.id, {
        firstName: validatedData.firstName || '',
        lastName: validatedData.lastName || '',
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Validation failed')) {
        next(new ValidationError(error.message));
      } else {
        next(error);
      }
    }
  }

  // Delete user account
  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // This would be implemented with Supabase admin functions
      // For now, return a placeholder response
      res.json({
        success: true,
        message: 'Account deletion requested. This feature will be implemented soon.',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  // Health check endpoint
  async healthCheck(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Auth service is healthy',
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  }
}

export const authController = new AuthController();
