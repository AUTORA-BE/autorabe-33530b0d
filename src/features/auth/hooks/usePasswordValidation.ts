/**
 * Password validation hook
 * Real-time password strength checking
 * @module features/auth/hooks
 */

import { useMemo } from 'react';
import type { PasswordValidation } from '../types/auth.types';

/**
 * Validates password against security requirements
 * 
 * @param password - Password to validate
 * @returns Validation status for each requirement
 * 
 * @example
 * ```tsx
 * const validation = usePasswordValidation(password);
 * if (!validation.isValid) {
 *   // Show validation errors
 * }
 * ```
 */
export function usePasswordValidation(password: string): PasswordValidation {
  return useMemo(() => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    const isValid = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

    return {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      isValid,
    };
  }, [password]);
}

export default usePasswordValidation;
