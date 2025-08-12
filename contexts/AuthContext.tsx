import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { API_ENDPOINTS } from '../constants/api';
import { apiService } from '../services/api';
import { unifiedNotificationService } from '../services/unifiedNotificationService';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordResetOTP: (email: string) => Promise<void>;
  resetPasswordWithOTP: (email: string, otp: string, password: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  TOKEN: '@expense_ai_token',
  USER: '@expense_ai_user',
  REFRESH_TOKEN: '@expense_ai_refresh_token',
} as const;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state from storage
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      if (storedToken && storedUser) {
        // I need to check if the token  has expired
        const decodedToken = jwtDecode(storedToken);
        if (decodedToken?.exp && decodedToken.exp < Date.now() / 1000) {
          await logout();
          return;
        }

        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          token: storedToken,
          isLoading: false,
          isAuthenticated: true,
        });

        // Setup push notifications for existing user
        try {
          await unifiedNotificationService.initialize();
          unifiedNotificationService.setupNotificationHandling();
        } catch (error) {
          console.error('Failed to setup push notifications:', error);
        }
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
        }));
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
      }));
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH_LOGIN, {
        email,
        password,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      const { user, accessToken, refreshToken } = response.data;

      // Store auth data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
        refreshToken && AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      ]);

      setAuthState({
        user,
        token: accessToken,
        isLoading: false,
        isAuthenticated: true,
      });

      // Register for push notifications after successful login
      try {
        await unifiedNotificationService.refreshPushToken();
        unifiedNotificationService.setupNotificationHandling();
      } catch (error) {
        console.error('Failed to register for push notifications:', error);
      }

      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: `Good to see you, ${user.firstName}`,
        visibilityTime: 3000,
      });
    } catch (error: any) {
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
      }));

      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message || 'Please check your credentials and try again',
        visibilityTime: 4000,
      });
    }
  };

  const signup = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<void> => {
    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH_SIGNUP, {
        email,
        password,
        firstName,
        lastName,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Signup failed');
      }

      const { user, accessToken, refreshToken } = response.data;

      // Store auth data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
        refreshToken && AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      ]);

      setAuthState({
        user,
        token: accessToken,
        isLoading: false,
        isAuthenticated: true,
      });

      // Register for push notifications after successful signup
      try {
        await unifiedNotificationService.refreshPushToken();
        unifiedNotificationService.setupNotificationHandling();
      } catch (error) {
        console.error('Failed to register for push notifications:', error);
      }

      Toast.show({
        type: 'success',
        text1: 'Account Created!',
        text2: `Welcome to ExpenseAI, ${user.firstName}!`,
        visibilityTime: 3000,
      });
    } catch (error: any) {
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
      }));

      Toast.show({
        type: 'error',
        text1: 'Signup Failed',
        text2: error.message || 'Failed to create account. Please try again.',
        visibilityTime: 4000,
      });
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.post(API_ENDPOINTS.AUTH_LOGOUT);

      // Clean up notification service
      await unifiedNotificationService.cleanup();

      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });

      Toast.show({
        type: 'success',
        text1: 'Signed Out',
        text2: 'Come back soon!',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there are errors
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const sendPasswordResetOTP = async (email: string): Promise<void> => {
    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH_FORGOT_PASSWORD, {
        email,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to send reset OTP');
      }

      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: 'Check your email for the OTP code',
        visibilityTime: 4000,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Send OTP',
        text2: error.message || 'Failed to send OTP. Please try again.',
        visibilityTime: 4000,
      });
    }
  };

  const resetPasswordWithOTP = async (
    email: string,
    otp: string,
    password: string
  ): Promise<void> => {
    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH_RESET_PASSWORD, {
        email,
        otp,
        password,
        confirmPassword: password,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to reset password');
      }

      Toast.show({
        type: 'success',
        text1: 'Password Reset Successful',
        text2: 'You can now sign in with your new password',
        visibilityTime: 4000,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: error.message || 'Failed to reset password. Please try again.',
        visibilityTime: 4000,
      });
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    // if (!authState.user) {
    //   throw new Error('User not authenticated');
    // }
    // try {
    //   // TODO: Replace with actual API call
    //   // const response = await fetch(`${API_BASE_URL}/users/profile`, {
    //   //   method: 'PUT',
    //   //   headers: {
    //   //     'Content-Type': 'application/json',
    //   //     'Authorization': `Bearer ${authState.token}`,
    //   //   },
    //   //   body: JSON.stringify(userData),
    //   // });
    //   // if (!response.ok) {
    //   //   throw new Error('Failed to update profile');
    //   // }
    //   // const updatedUser = await response.json();
    //   // Mock response for development
    //   await new Promise((resolve) => setTimeout(resolve, 1000));
    //   const updatedUser = {
    //     ...authState.user,
    //     ...userData,
    //     updatedAt: new Date().toISOString(),
    //   };
    //   // Update stored user data
    //   await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    //   setAuthState((prev) => ({
    //     ...prev,
    //     user: updatedUser,
    //   }));
    // } catch (error) {
    //   throw error;
    // }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // TODO: Replace with actual API call
      // const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ refreshToken }),
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to refresh token');
      // }

      // const data = await response.json();

      // Mock response for development
      const newToken = 'refreshed_jwt_token_' + Date.now();
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, newToken);

      setAuthState((prev) => ({
        ...prev,
        token: newToken,
      }));
    } catch (error) {
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  const setUser = (user: User) => {
    AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    setAuthState((prev) => ({
      ...prev,
      user,
    }));
  };

  const value: AuthContextType = {
    ...authState,
    login,
    signup,
    logout,
    sendPasswordResetOTP,
    resetPasswordWithOTP,
    updateProfile,
    refreshToken,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  console.log('context', context);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
