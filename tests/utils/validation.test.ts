/**
 * Tests for lib/utils/validation.ts
 */

import { describe, it, expect } from 'vitest';
import {
  validatePassword,
  calculatePasswordStrength,
  isValidEmail,
  isValidName,
  PASSWORD_STRENGTH_LABELS,
  PASSWORD_STRENGTH_COLORS,
} from '@/lib/utils/validation';

describe('validatePassword', () => {
  it('should reject empty password', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password is required');
    expect(result.strength).toBe(0);
  });

  it('should reject password shorter than 8 characters', () => {
    const result = validatePassword('Short1!');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must be at least 8 characters');
  });

  it('should reject password without letters', () => {
    const result = validatePassword('12345678!');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must contain both letters and numbers');
  });

  it('should reject password without numbers', () => {
    const result = validatePassword('Password!');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must contain both letters and numbers');
  });

  it('should reject password without special characters', () => {
    const result = validatePassword('Password123');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must contain at least one special character');
  });

  it('should accept valid password with all requirements', () => {
    const result = validatePassword('Password123!');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.strength).toBeGreaterThan(0);
  });

  it('should accept strong password with high strength score', () => {
    const result = validatePassword('MySecure@Password123');
    expect(result.isValid).toBe(true);
    expect(result.strength).toBeGreaterThanOrEqual(4);
  });
});

describe('calculatePasswordStrength', () => {
  it('should return 0 for very short password', () => {
    expect(calculatePasswordStrength('short')).toBe(0);
  });

  it('should return 1 for password >= 8 chars', () => {
    expect(calculatePasswordStrength('aaaaaaaa')).toBe(1);
  });

  it('should add points for 12+ characters', () => {
    const short = calculatePasswordStrength('aaaaaaaa');
    const long = calculatePasswordStrength('aaaaaaaaaaaa');
    expect(long).toBeGreaterThan(short);
  });

  it('should add points for uppercase letters', () => {
    const lower = calculatePasswordStrength('aaaaaaaa');
    const upper = calculatePasswordStrength('Aaaaaaaa');
    expect(upper).toBeGreaterThan(lower);
  });

  it('should add points for numbers', () => {
    const noNum = calculatePasswordStrength('aaaaaaaa');
    const withNum = calculatePasswordStrength('aaaaaaa1');
    expect(withNum).toBeGreaterThan(noNum);
  });

  it('should add points for special characters', () => {
    const noSpecial = calculatePasswordStrength('aaaaaaaa');
    const withSpecial = calculatePasswordStrength('aaaaaaa!');
    expect(withSpecial).toBeGreaterThan(noSpecial);
  });

  it('should return max 5 for strongest password', () => {
    const result = calculatePasswordStrength('MySecure@Pass123');
    expect(result).toBe(5);
  });
});

describe('isValidEmail', () => {
  it('should return false for empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('should return false for invalid email formats', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });

  it('should return true for valid email formats', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user.name@example.com')).toBe(true);
    expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
  });
});

describe('isValidName', () => {
  it('should return false for empty string', () => {
    expect(isValidName('')).toBe(false);
  });

  it('should return false for null/undefined', () => {
    expect(isValidName(null as unknown as string)).toBe(false);
    expect(isValidName(undefined as unknown as string)).toBe(false);
  });

  it('should return false for single character', () => {
    expect(isValidName('A')).toBe(false);
  });

  it('should return false for whitespace only', () => {
    expect(isValidName('   ')).toBe(false);
  });

  it('should return true for 2+ character names', () => {
    expect(isValidName('Jo')).toBe(true);
    expect(isValidName('John Doe')).toBe(true);
  });
});

describe('PASSWORD_STRENGTH_LABELS', () => {
  it('should have labels for all strength levels 0-5', () => {
    expect(PASSWORD_STRENGTH_LABELS[0]).toBe('Very Weak');
    expect(PASSWORD_STRENGTH_LABELS[5]).toBe('Very Strong');
  });
});

describe('PASSWORD_STRENGTH_COLORS', () => {
  it('should have colors for all strength levels 0-5', () => {
    expect(PASSWORD_STRENGTH_COLORS[0]).toBe('bg-red-500');
    expect(PASSWORD_STRENGTH_COLORS[5]).toBe('bg-emerald-500');
  });
});
