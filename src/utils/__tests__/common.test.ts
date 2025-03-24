import { extractFirstUuidFromPath, generateId } from '../common';

describe('common utility functions', () => {
  describe('generateId', () => {
    it('should generate a random string ID', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('extractFirstUuidFromPath', () => {
    // Happy path tests
    it('should extract UUID from a simple path', () => {
      const path = '/patients/123e4567-e89b-12d3-a456-426614174000';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should extract UUID from a path with multiple segments', () => {
      const path =
        '/patients/123e4567-e89b-12d3-a456-426614174000/visits/recent';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should extract UUID from the middle of a path', () => {
      const path =
        '/dashboard/patients/123e4567-e89b-12d3-a456-426614174000/profile';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should extract UUID from the end of a path', () => {
      const path = '/dashboard/patients/123e4567-e89b-12d3-a456-426614174000';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should extract UUID with uppercase characters', () => {
      const path = '/patients/123E4567-E89B-12D3-A456-426614174000';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123E4567-E89B-12D3-A456-426614174000');
    });

    it('should extract UUID with mixed case characters', () => {
      const path = '/patients/123e4567-E89b-12D3-a456-426614174000';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-E89b-12D3-a456-426614174000');
    });

    it('should extract the first UUID when multiple UUIDs are present', () => {
      const path =
        '/patients/123e4567-e89b-12d3-a456-426614174000/visits/98765432-abcd-efgh-ijkl-123456789012';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should extract UUID from a path with query parameters', () => {
      const path =
        '/patients/123e4567-e89b-12d3-a456-426614174000?name=John&age=30';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should extract UUID from a path with hash fragments', () => {
      const path = '/patients/123e4567-e89b-12d3-a456-426614174000#details';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    // Sad path tests
    it('should return null for null input', () => {
      const result = extractFirstUuidFromPath(null as unknown as string);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = extractFirstUuidFromPath(undefined as unknown as string);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = extractFirstUuidFromPath('');
      expect(result).toBeNull();
    });

    it('should return null for non-string input', () => {
      const result = extractFirstUuidFromPath(123 as unknown as string);
      expect(result).toBeNull();
    });

    it('should return null for object input', () => {
      const result = extractFirstUuidFromPath({} as unknown as string);
      expect(result).toBeNull();
    });

    it('should return null for array input', () => {
      const result = extractFirstUuidFromPath([] as unknown as string);
      expect(result).toBeNull();
    });

    it('should return null for path without UUID', () => {
      const path = '/patients/list';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBeNull();
    });

    it('should return null for path with malformed UUID (missing segment)', () => {
      const path = '/patients/123e4567-e89b-12d3-a456';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBeNull();
    });

    it('should return null for path with malformed UUID (wrong format)', () => {
      const path = '/patients/123e4567-e89b-12d3-a456-42661417400Z'; // 'Z' is not a hex character
      const result = extractFirstUuidFromPath(path);
      expect(result).toBeNull();
    });

    it('should return null for path with malformed UUID (missing hyphens)', () => {
      const path = '/patients/123e4567e89b12d3a456426614174000'; // No hyphens
      const result = extractFirstUuidFromPath(path);
      expect(result).toBeNull();
    });

    it('should return null for path with UUID-like string but incorrect format', () => {
      const path = '/patients/not-a-real-uuid-but-has-hyphens';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBeNull();
    });
  });
});
