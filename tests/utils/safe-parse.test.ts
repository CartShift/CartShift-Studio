/**
 * Tests for lib/utils/safe-parse.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import {
  safeParse,
  safeLocalStorageGet,
  safeLocalStorageSet,
  validateData,
} from '@/lib/utils/safe-parse';

describe('safeParse', () => {
  describe('without schema', () => {
    it('should parse valid JSON', () => {
      const result = safeParse<{ name: string }>('{"name": "test"}');
      expect(result).toEqual({ name: 'test' });
    });

    it('should return null for invalid JSON', () => {
      const result = safeParse('not valid json');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = safeParse('');
      expect(result).toBeNull();
    });

    it('should parse arrays', () => {
      const result = safeParse<number[]>('[1, 2, 3]');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should parse primitives', () => {
      expect(safeParse('"hello"')).toBe('hello');
      expect(safeParse('42')).toBe(42);
      expect(safeParse('true')).toBe(true);
      expect(safeParse('null')).toBeNull();
    });
  });

  describe('with schema', () => {
    const userSchema = z.object({
      id: z.string(),
      name: z.string(),
      age: z.number().optional(),
    });

    it('should parse and validate valid data', () => {
      const result = safeParse('{"id": "123", "name": "John"}', userSchema);
      expect(result).toEqual({ id: '123', name: 'John' });
    });

    it('should return null for valid JSON but invalid schema', () => {
      const result = safeParse('{"id": 123, "name": "John"}', userSchema);
      expect(result).toBeNull(); // id should be string, not number
    });

    it('should return null for missing required fields', () => {
      const result = safeParse('{"id": "123"}', userSchema);
      expect(result).toBeNull(); // name is required
    });

    it('should include optional fields when present', () => {
      const result = safeParse('{"id": "123", "name": "John", "age": 30}', userSchema);
      expect(result).toEqual({ id: '123', name: 'John', age: 30 });
    });
  });
});

describe('safeLocalStorageGet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should return null when key does not exist', () => {
    const result = safeLocalStorageGet('nonexistent');
    expect(result).toBeNull();
  });

  it('should parse valid stored JSON', () => {
    localStorage.setItem('key', '{"name": "test"}');
    const result = safeLocalStorageGet<{ name: string }>('key');
    expect(result).toEqual({ name: 'test' });
  });

  it('should validate against schema if provided', () => {
    const schema = z.object({ id: z.string() });
    localStorage.setItem('key', '{"id": "123"}');

    const result = safeLocalStorageGet('key', schema);
    expect(result).toEqual({ id: '123' });
  });

  it('should return null for invalid schema match', () => {
    const schema = z.object({ id: z.string() });
    localStorage.setItem('key', '{"id": 123}');

    const result = safeLocalStorageGet('key', schema);
    expect(result).toBeNull();
  });
});

describe('safeLocalStorageSet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should store value as JSON', () => {
    const result = safeLocalStorageSet('key', { name: 'test' });
    expect(result).toBe(true);
    expect(localStorage.getItem('key')).toBe('{"name":"test"}');
  });

  it('should return false on error', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage full');
    });

    const result = safeLocalStorageSet('key', { name: 'test' });
    expect(result).toBe(false);

    vi.restoreAllMocks();
  });
});

describe('validateData', () => {
  const schema = z.object({
    id: z.string(),
    count: z.number(),
  });

  it('should return validated data when valid', () => {
    const result = validateData({ id: '123', count: 5 }, schema);
    expect(result).toEqual({ id: '123', count: 5 });
  });

  it('should return null for invalid data', () => {
    const result = validateData({ id: 123, count: 'five' }, schema);
    expect(result).toBeNull();
  });

  it('should return null for null input', () => {
    const result = validateData(null, schema);
    expect(result).toBeNull();
  });

  it('should return null for undefined input', () => {
    const result = validateData(undefined, schema);
    expect(result).toBeNull();
  });
});
