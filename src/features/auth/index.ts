/**
 * Auth feature barrel export
 * Re-exports all public APIs from the auth feature
 * @module features/auth
 */

// Hooks
export { useAuth, usePasswordValidation, useUserProfile } from './hooks';

// Types
export type {
  AuthState,
  LoginCredentials,
  SignupCredentials,
  AuthErrorType,
  AuthResult,
  PasswordValidation,
  AuthFormErrors,
  UserProfile,
} from './types/auth.types';
