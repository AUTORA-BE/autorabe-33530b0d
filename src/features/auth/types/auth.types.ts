/**
 * Authentication feature type definitions
 * @module features/auth/types
 */

import { User, Session } from '@supabase/supabase-js';

/**
 * User authentication state
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Signup credentials
 */
export interface SignupCredentials extends LoginCredentials {
  fullName: string;
  phone?: string;
}

/**
 * Authentication error types
 */
export type AuthErrorType = 
  | 'invalid_credentials'
  | 'user_exists'
  | 'email_not_confirmed'
  | 'weak_password'
  | 'network_error'
  | 'unknown';

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  error?: {
    type: AuthErrorType;
    message: string;
  };
}

/**
 * Password validation rules
 */
export interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isValid: boolean;
}

/**
 * Form validation errors
 */
export interface AuthFormErrors {
  email?: string;
  password?: string;
  name?: string;
}

/**
 * User profile data
 */
export interface UserProfile {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
