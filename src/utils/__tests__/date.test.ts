import { calculateAge } from '../date';

describe('calculateAge', () => {
  // Store the original Date implementation and mock date
  const mockDate = new Date(2025, 2, 24); // 2025-03-24 (Month is 0-indexed in JS Date)

  // Mock date for consistent testing
  beforeEach(() => {
    // Mock current date for testing
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  // Restore original Date after tests
  afterEach(() => {
    jest.useRealTimers();
  });

  // Happy path tests
  it('should calculate age correctly for a past date', () => {
    const result = calculateAge('1990-05-15');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(34); // 2025 - 1990 = 35, but birthday hasn't occurred yet in March
    expect(result?.months).toBe(10); // 10 months since last birthday
    expect(result?.days).toBe(9); // 9 days since last month anniversary
  });

  it('should calculate age correctly when birthday is today', () => {
    const result = calculateAge('2000-03-24');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(25); // 2025 - 2000 = 25, birthday is today
    expect(result?.months).toBe(0); // 0 months since birthday is today
    expect(result?.days).toBe(0); // 0 days since birthday is today
  });

  it('should calculate age correctly when birthday was yesterday', () => {
    const result = calculateAge('2000-03-23');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(25); // 2025 - 2000 = 25, birthday has occurred this year
    expect(result?.months).toBe(0); // 0 months since birthday just happened
    expect(result?.days).toBe(1); // 1 day since birthday
  });

  it('should calculate age correctly for February 29th in a leap year', () => {
    const result = calculateAge('2000-02-29'); // 2000 was a leap year
    expect(result).not.toBeNull();
    expect(result?.years).toBe(25); // 2025 - 2000 = 25, birthday has occurred this year
    expect(result?.months).toBe(0); // Testing month calculation for leap year
    expect(result?.days).toBe(24); // Days since Feb 29 (treated as Feb 28 in non-leap years)
  });

  it('should calculate age correctly for a date many years ago', () => {
    const result = calculateAge('1925-01-01');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(100); // 2025 - 1925 = 100, birthday has occurred this year
    expect(result?.months).toBe(2); // 2 months since January
    expect(result?.days).toBe(23); // 23 days in current month
  });

  it('should calculate age correctly for a recent date', () => {
    const result = calculateAge('2024-01-01');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(1); // 2025 - 2024 = 1, birthday has occurred this year
    expect(result?.months).toBe(2); // 2 months since January
    expect(result?.days).toBe(23); // 23 days in current month
  });

  it('should calculate age as 0 years for a child less than 1 year old', () => {
    const result = calculateAge('2024-12-31');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(0); // Child born less than a year ago
    expect(result?.months).toBe(2); // 2 months since December 31
    expect(result?.days).toBe(24); // 24 days in current month
  });

  it('should calculate months and days correctly for a child born 2 months ago', () => {
    const result = calculateAge('2025-01-24');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(0); // Child born less than a year ago
    expect(result?.months).toBe(2); // Exactly 2 months ago
    expect(result?.days).toBe(0); // Exactly on the day
  });

  // Sad path tests
  it('should return null for invalid date format', () => {
    const result = calculateAge('05/15/1990'); // MM/DD/YYYY format
    expect(result).toBeNull();
  });

  it('should return null for date with invalid separators', () => {
    const result = calculateAge('1990/05/15'); // Using / instead of -
    expect(result).toBeNull();
  });

  it('should return null for date with invalid month (> 12)', () => {
    const result = calculateAge('1990-13-15');
    expect(result).toBeNull();
  });

  it('should return null for date with invalid day (> 31)', () => {
    const result = calculateAge('1990-05-32');
    expect(result).toBeNull();
  });

  it('should return null for non-existent date (February 30th)', () => {
    const result = calculateAge('1990-02-30');
    expect(result).toBeNull();
  });

  it('should return null for future date', () => {
    const result = calculateAge('2026-01-01'); // Future date
    expect(result).toBeNull();
  });

  it('should return null for null input', () => {
    const result = calculateAge(null as unknown as string);
    expect(result).toBeNull();
  });

  it('should return null for undefined input', () => {
    const result = calculateAge(undefined as unknown as string);
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = calculateAge('');
    expect(result).toBeNull();
  });

  it('should return null for non-string input', () => {
    const result = calculateAge(123 as unknown as string);
    expect(result).toBeNull();
  });

  it('should return null for malformed date string (missing parts)', () => {
    const result = calculateAge('1990-05');
    expect(result).toBeNull();
  });

  it('should return null for malformed date string (extra parts)', () => {
    const result = calculateAge('1990-05-15-00');
    expect(result).toBeNull();
  });

  it('should return null for date string with non-numeric characters', () => {
    const result = calculateAge('199O-05-15'); // Using letter O instead of zero
    expect(result).toBeNull();
  });
});
