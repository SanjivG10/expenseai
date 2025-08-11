// Authentication types

// === SIGNUP ENDPOINT ===
// POST /api/v1/auth/signup
export interface SignupRequest {
  email: string; // Valid email, 5-254 chars
  password: string; // 8-128 chars, must contain upper/lower/number/special
  firstName: string; // 2-50 chars, letters/spaces/hyphens/apostrophes
  lastName: string; // 2-50 chars, letters/spaces/hyphens/apostrophes
}

export interface SignupResponse {
  success: boolean;
  message: string;
  data?: {
    user: any; // Supabase User object
    session: any; // Supabase Session object
  };
}

// === LOGIN ENDPOINT ===
// POST /api/v1/auth/login
export interface LoginRequest {
  email: string; // Valid email
  password: string; // Required
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: any; // Supabase User object
    session: any; // Supabase Session object
    access_token: string;
    refresh_token: string;
  };
}

// === LOGOUT ENDPOINT ===
// POST /api/v1/auth/logout
export interface LogoutResponse {
  success: boolean;
  message: string;
}

// === REFRESH TOKEN ENDPOINT ===
// POST /api/v1/auth/refresh
export interface RefreshTokenRequest {
  refreshToken: string; // Required refresh token
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
    user: any; // Supabase User object
  };
}

// === FORGOT PASSWORD ENDPOINT ===
// POST /api/v1/auth/forgot-password
export interface ForgotPasswordRequest {
  email: string; // Valid email
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

// === RESET PASSWORD ENDPOINT ===
// POST /api/v1/auth/reset-password
export interface ResetPasswordRequest {
  email: string; // Valid email
  otp: string; // 6-10 chars
  password: string; // 8-128 chars, must contain upper/lower/number/special
  confirmPassword: string; // Must match password
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// === GET PROFILE ENDPOINT ===
// GET /api/v1/auth/profile
export interface GetProfileResponse {
  success: boolean;
  message: string;
  data: any; // Supabase User object
}

// === VERIFY OTP ENDPOINT ===
// POST /api/v1/auth/verify-otp
export interface VerifyOTPRequest {
  email: string; // Valid email
  token: string; // 6-10 chars OTP
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
}