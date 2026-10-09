import { combineDateAndTime } from '../utils';

describe('combineDateAndTime', () => {
  it('returns undefined when no date is provided', () => {
    expect(combineDateAndTime(null, '10:30')).toBeUndefined();
  });

  it('combines a date and a valid HH:mm (24-hour) time', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const result = combineDateAndTime(date, '10:30');

    expect(result).toBeDefined();
    const combined = new Date(result!);
    expect(combined.getHours()).toBe(10);
    expect(combined.getMinutes()).toBe(30);
  });

  it('combines a date and a valid HH:mm (24-hour) time in the afternoon', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const result = combineDateAndTime(date, '22:30');

    expect(result).toBeDefined();
    const combined = new Date(result!);
    expect(combined.getHours()).toBe(22);
    expect(combined.getMinutes()).toBe(30);
  });

  it('returns just the date (as ISO) when no time is provided', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const result = combineDateAndTime(date, '');

    expect(result).toBe(date.toISOString());
  });

  it('ignores a malformed time string', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const result = combineDateAndTime(date, 'not-a-time');

    expect(result).toBe(date.toISOString());
  });
});
