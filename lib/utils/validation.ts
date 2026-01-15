/**
 * Shared validation utilities
 * Provides centralized validation logic for form fields across the application
 */

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
  strength: number; // 0-5 scale
}

/**
 * Validates password according to NIST and industry security standards
 *
 * Requirements:
 * - Minimum 8 characters
 * - Must contain at least one letter (a-z, A-Z)
 * - Must contain at least one number (0-9)
 * - Required: At least one special character for security
 *
 * @param password - Password string to validate
 * @returns Validation result with error message if invalid
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return {
      isValid: false,
      error: 'Password is required',
      strength: 0,
    };
  }

  // Check minimum length
  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters',
      strength: 0,
    };
  }

  // Check for letters (both uppercase and lowercase)
  const hasLetters = /[a-zA-Z]/.test(password);

  // Check for numbers
  const hasNumbers = /[0-9]/.test(password);

  // Check for special characters (now required for security)
  const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (!hasLetters || !hasNumbers) {
    return {
      isValid: false,
      error: 'Password must contain both letters and numbers',
      strength: hasLetters || hasNumbers ? 1 : 0,
    };
  }

  if (!hasSpecialChars) {
    return {
      isValid: false,
      error: 'Password must contain at least one special character',
      strength: hasLetters && hasNumbers ? 2 : 1,
    };
  }

  // Calculate password strength (0-5 scale)
  const strength = calculatePasswordStrength(password);

  return {
    isValid: true,
    strength,
  };
}

/**
 * Calculates password strength on a 0-5 scale
 *
 * Scoring:
 * - +1 for 8+ characters (minimum requirement)
 * - +1 for 12+ characters (stronger)
 * - +1 for uppercase letter
 * - +1 for number
 * - +1 for special character
 *
 * @param password - Password string to analyze
 * @returns Strength score (0-5)
 */
export function calculatePasswordStrength(password: string): number {
  let strength = 0;

  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  return strength;
}

/**
 * Validates email format
 *
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates name field
 *
 * @param name - Name string to validate
 * @returns true if valid
 */
export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;

  // Minimum 2 characters
  return name.trim().length >= 2;
}

/**
 * Strength labels for password strength indicator
 */
export const PASSWORD_STRENGTH_LABELS = {
  0: 'Very Weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
  5: 'Very Strong',
} as const;

/**
 * Strength colors for password strength indicator (Tailwind classes)
 */
export const PASSWORD_STRENGTH_COLORS = {
  0: 'bg-red-500',
  1: 'bg-orange-500',
  2: 'bg-yellow-500',
  3: 'bg-lime-500',
  4: 'bg-green-500',
  5: 'bg-emerald-500',
} as const;
