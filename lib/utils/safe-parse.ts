/**
 * Safe Parse Utilities
 *
 * Provides type-safe JSON parsing with optional Zod validation.
 * Use these utilities instead of raw JSON.parse to prevent runtime errors.
 */

import { z } from 'zod';

/**
 * Safely parses a JSON string with optional Zod schema validation.
 *
 * @param json - The JSON string to parse
 * @param schema - Optional Zod schema for validation
 * @returns Parsed and validated data, or null if parsing/validation fails
 *
 * @example
 * ```typescript
 * // Without schema (type assertion needed)
 * const data = safeParse<UserData>(jsonString);
 *
 * // With schema (type-safe)
 * const userSchema = z.object({ id: z.string(), name: z.string() });
 * const user = safeParse(jsonString, userSchema);
 * ```
 */
export function safeParse<T>(json: string, schema?: z.ZodType<T>): T | null {
  try {
    const parsed = JSON.parse(json);

    if (schema) {
      const result = schema.safeParse(parsed);
      return result.success ? result.data : null;
    }

    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Safely retrieves and parses a value from localStorage.
 *
 * @param key - The localStorage key to retrieve
 * @param schema - Optional Zod schema for validation
 * @returns Parsed and validated data, or null if not found/invalid
 *
 * @example
 * ```typescript
 * // Get cached user data with validation
 * const userSchema = z.object({ id: z.string(), email: z.string() });
 * const cachedUser = safeLocalStorageGet('user_data', userSchema);
 * ```
 */
export function safeLocalStorageGet<T>(key: string, schema?: z.ZodType<T>): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    return safeParse<T>(item, schema);
  } catch {
    return null;
  }
}

/**
 * Safely sets a value in localStorage as JSON.
 *
 * @param key - The localStorage key
 * @param value - The value to store (will be JSON stringified)
 * @returns true if successful, false otherwise
 */
export function safeLocalStorageSet<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates unknown data against a Zod schema.
 *
 * @param data - Unknown data to validate
 * @param schema - Zod schema for validation
 * @returns Validated data or null if validation fails
 *
 * @example
 * ```typescript
 * const schema = z.object({ id: z.string() });
 * const result = validateData(unknownApiResponse, schema);
 * if (result) {
 *   // result is now typed as { id: string }
 * }
 * ```
 */
export function validateData<T>(data: unknown, schema: z.ZodType<T>): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}
