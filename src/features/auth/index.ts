/**
 * Auth feature barrel export
 * Re-exports all public APIs from the auth feature
 * @module features/auth
 */

// Hooks
export { useAuth, usePasswordValidation, useUserProfile } from './hooks';

// Auth-prompt (positive friction for guests)
export { AuthPromptProvider, useAuthPrompt, consumePendingFavorite } from './context/AuthPromptContext';
export { AuthPromptModal, type AuthPromptReason } from './components/AuthPromptModal';


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
