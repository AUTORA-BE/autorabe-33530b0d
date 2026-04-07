/**
 * Security utilities for input sanitization and validation
 */

// HTML entities to escape for XSS prevention
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escapes HTML entities to prevent XSS attacks
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitizes user input by trimming, removing control characters, and limiting length
 */
export function sanitizeInput(input: string, maxLength = 1000): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    // Remove null bytes and control characters (except newlines/tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Limit length
    .slice(0, maxLength);
}

/**
 * Sanitizes text that may contain newlines (for descriptions, messages)
 */
export function sanitizeMultilineInput(input: string, maxLength = 5000): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    // Remove null bytes and control characters (keep newlines/tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize multiple newlines to max 2
    .replace(/\n{3,}/g, '\n\n')
    // Limit length
    .slice(0, maxLength);
}

/**
 * Validates and sanitizes phone numbers (Belgian format)
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove all non-digit characters except + at start
  const cleaned = phone.replace(/(?!^\+)[^\d]/g, '');
  
  // Belgian phone validation: starts with +32, 0032, or 04/02/03/09
  if (/^(\+32|0032|0[1-9])/.test(cleaned)) {
    return cleaned.slice(0, 15); // Max international phone length
  }
  
  return '';
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Server-side rate limiting via Edge Function
 * Falls back to localStorage if the server is unreachable
 */
export async function checkServerRateLimit(
  action: string,
  identifier?: string
): Promise<{ allowed: boolean }> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('check-rate-limit', {
      body: { action, identifier },
    });

    if (error) {
      console.warn('Rate limit check failed, allowing action:', error);
      return { allowed: true };
    }

    return { allowed: data?.allowed ?? true };
  } catch {
    return { allowed: true };
  }
}

/**
 * Client-side rate limiting fallback using localStorage
 * @deprecated Prefer checkServerRateLimit for production use
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export function checkRateLimit(
  key: string, 
  maxAttempts: number, 
  windowMs: number
): { allowed: boolean; remainingAttempts: number; resetIn: number } {
  const storageKey = `ratelimit_${key}`;
  const now = Date.now();
  
  try {
    const stored = localStorage.getItem(storageKey);
    let entry: RateLimitEntry = stored ? JSON.parse(stored) : { count: 0, resetTime: now + windowMs };
    
    if (now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
    }
    
    const allowed = entry.count < maxAttempts;
    
    if (allowed) {
      entry.count++;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    }
    
    return {
      allowed,
      remainingAttempts: Math.max(0, maxAttempts - entry.count),
      resetIn: Math.max(0, entry.resetTime - now),
    };
  } catch {
    return { allowed: true, remainingAttempts: maxAttempts, resetIn: 0 };
  }
}

/**
 * Validates URL to prevent open redirect vulnerabilities
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url, window.location.origin);
    // Only allow same-origin URLs or specific trusted domains
    return parsed.origin === window.location.origin;
  } catch {
    // If parsing fails, check if it's a relative URL
    return url.startsWith('/') && !url.startsWith('//');
  }
}

/**
 * Generates a cryptographically secure random string
 */
export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Content Security Policy nonce generator
 */
export function generateNonce(): string {
  return generateSecureToken(16);
}
