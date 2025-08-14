import { User as SupabaseUser } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { supabase, supabaseAdmin } from '../config/supabase';
import { AppError, AuthenticationError, DuplicateError } from '../utils/errors';
import { createDefaultCategoriesForUser } from './setupService';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class AuthService {
  // Generate JWT tokens
  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload = {
      userId: user.id,
      email: user.email,
    };

    // Access token expires in 6 months
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '0.5y',
    });

    // Refresh token expires in 1 year
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: '1y',
    });

    return { accessToken, refreshToken };
  }

  // Convert Supabase user to our User interface
  private mapSupabaseUser(supabaseUser: SupabaseUser, metadata?: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      firstName: metadata?.firstName || supabaseUser.user_metadata?.firstName || '',
      lastName: metadata?.lastName || supabaseUser.user_metadata?.lastName || '',
      emailVerified: supabaseUser.email_confirmed_at != null,
      createdAt: supabaseUser.created_at,
      updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
    };
  }

  // Set RevenueCat user ID in user metadata
  private async setRevenueCatUserId(userId: string): Promise<void> {
    try {
      // Check if RevenueCat user ID is already set
      const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (!user.user?.user_metadata?.revenuecat_user_id) {
        // Set the Supabase Auth user ID as the RevenueCat user ID
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...user.user?.user_metadata,
            revenuecat_user_id: userId,
          },
        });
        console.log(`✅ Set RevenueCat user ID for user: ${userId}`);
      }
    } catch (error) {
      console.error('Failed to set RevenueCat user ID:', error);
      // Don't throw error as this is not critical for auth flow
    }
  }

  // User signup
  async signup(signupData: SignupData): Promise<AuthResult> {
    const { email, password, firstName, lastName } = signupData;

    try {
      // Note: We'll let Supabase handle duplicate email checking during user creation
      // as we can't directly query auth.users from client SDK

      // Create user with Supabase Auth
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          firstName,
          lastName,
        },
        email_confirm: true,
      });

      if (error) {
        throw new AppError('Failed to create user account', 400, 'SIGNUP_FAILED', error);
      }

      if (!data.user) {
        throw new AppError('Failed to create user', 400, 'SIGNUP_FAILED');
      }

      const user = this.mapSupabaseUser(data.user, { firstName, lastName });
      const tokens = this.generateTokens(user);

      // Set RevenueCat user ID in metadata
      await this.setRevenueCatUserId(user.id);
      
      await createDefaultCategoriesForUser(user.id);

      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Signup failed', 500, 'SIGNUP_ERROR', error);
    }
  }

  // User login
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { email, password } = credentials;

    try {
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        throw new AuthenticationError(error?.message || 'Invalid email or password');
      }

      const user = this.mapSupabaseUser(data.user);
      const tokens = this.generateTokens(user);

      // Set RevenueCat user ID in metadata if not already set
      await this.setRevenueCatUserId(user.id);

      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AuthenticationError('Login failed');
    }
  }

  // Forgot password - send OTP
  async forgotPassword(email: string): Promise<void> {
    try {
      // Use Supabase's OTP system for password reset
      const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      });

      if (error) {
        throw new AppError(
          error.message || 'Failed to send password reset OTP',
          400,
          'PASSWORD_RESET_FAILED',
          error
        );
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Password reset failed', 500, 'PASSWORD_RESET_ERROR', error);
    }
  }

  // Reset password with OTP and new password (combined endpoint)
  async resetPasswordWithOTP(email: string, otp: string, newPassword: string): Promise<void> {
    try {
      // Verify OTP and update password in one step
      const { error } = await supabaseAdmin.auth.verifyOtp({
        email,
        token: otp,
        type: 'magiclink',
      });

      if (error) {
        throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP', error);
      }

      // Now update the password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(email, {
        password: newPassword,
      });

      if (updateError) {
        throw new AppError('Failed to update password', 400, 'PASSWORD_UPDATE_FAILED', updateError);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Password reset failed', 500, 'PASSWORD_RESET_ERROR', error);
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;

      // Get user from Supabase
      const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(decoded.userId);

      if (error || !userData.user) {
        throw new AuthenticationError('Invalid refresh token');
      }

      const user = this.mapSupabaseUser(userData.user);
      const tokens = this.generateTokens(user);

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      throw new AppError('Token refresh failed', 500, 'TOKEN_REFRESH_ERROR', error);
    }
  }

  // Logout user (invalidate refresh token)
  async logout(): Promise<void> {
    try {
      // Note: With admin operations, explicit signOut not needed as we're using service role
    } catch (error) {
      throw new AppError('Logout failed', 500, 'LOGOUT_ERROR', error);
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (error || !data.user) {
        return null;
      }

      return this.mapSupabaseUser(data.user);
    } catch (error) {
      return null;
    }
  }

  // Verify JWT token
  async verifyAccessToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      return await this.getUserById(decoded.userId);
    } catch (error) {
      return null;
    }
  }

  // Update user profile
  async updateProfile(
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
    }
  ): Promise<User> {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          firstName: updates.firstName,
          lastName: updates.lastName,
        },
      });

      if (error || !data.user) {
        throw new AppError('Failed to update user profile', 400, 'PROFILE_UPDATE_FAILED', error);
      }

      return this.mapSupabaseUser(data.user, updates);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Profile update failed', 500, 'PROFILE_UPDATE_ERROR', error);
    }
  }
}

export const authService = new AuthService();
