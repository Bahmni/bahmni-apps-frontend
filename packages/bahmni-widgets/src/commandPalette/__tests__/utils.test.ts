import {
  buildPrimaryText,
  filterItems,
  getInitials,
  matchesKeys,
} from '../utils';

const makePatient = (overrides = {}) =>
  ({
    uuid: 'uuid-1',
    givenName: 'John',
    middleName: '',
    familyName: 'Doe',
    identifier: 'P001',
    age: '30',
    gender: 'M',
    birthDate: null,
    addressFieldValue: null,
    extraIdentifiers: null,
    customAttribute: null,
    activeVisitUuid: null,
    ...overrides,
  }) as any;

const makeKeyboardEvent = (
  overrides: Partial<KeyboardEvent> = {},
): KeyboardEvent =>
  ({
    key: '',
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  }) as KeyboardEvent;

describe('filterItems', () => {
  it('always returns 1 for patient items regardless of search', () => {
    expect(filterItems('patient:uuid:John Doe', 'xyz')).toBe(1);
  });

  it('returns 1 for any item when search is less than 2 chars', () => {
    expect(filterItems('Go to Registration', 'x')).toBe(1);
    expect(filterItems('Go to Registration', '')).toBe(1);
  });

  it('returns 1 when value matches search (case insensitive)', () => {
    expect(filterItems('Go to Registration', 'registration')).toBe(1);
    expect(filterItems('Go to Registration', 'REGISTRATION')).toBe(1);
  });

  it('returns 0 when value does not match search', () => {
    expect(filterItems('Go to Registration', 'clinical')).toBe(0);
  });
});

describe('getInitials', () => {
  it('returns first letter of given and family name uppercased', () => {
    expect(getInitials('John', 'Doe')).toBe('JD');
  });

  it('returns "?" when both names are empty', () => {
    expect(getInitials('', '')).toBe('?');
  });

  it('handles only given name', () => {
    expect(getInitials('John', '')).toBe('J');
  });

  it('handles only family name', () => {
    expect(getInitials('', 'Doe')).toBe('D');
  });

  it('returns "?" when both names are undefined', () => {
    expect(
      getInitials(
        undefined as unknown as string,
        undefined as unknown as string,
      ),
    ).toBe('?');
  });

  it('lowercases input before uppercasing result', () => {
    expect(getInitials('alice', 'brown')).toBe('AB');
  });
});

describe('buildPrimaryText', () => {
  it('joins primary fields with " · " separator', () => {
    const patient = makePatient();
    expect(buildPrimaryText(patient, ['name', 'identifier'])).toBe(
      'John Doe · P001',
    );
  });

  it('omits fields with null/undefined values', () => {
    const patient = makePatient({ addressFieldValue: null });
    expect(buildPrimaryText(patient, ['name', 'addressFieldValue'])).toBe(
      'John Doe',
    );
  });

  it('includes middle name when present', () => {
    const patient = makePatient({ middleName: 'M' });
    expect(buildPrimaryText(patient, ['name'])).toBe('John M Doe');
  });

  it('returns empty string when all fields are empty', () => {
    const patient = makePatient({
      givenName: '',
      familyName: '',
      middleName: '',
    });
    expect(buildPrimaryText(patient, ['name'])).toBe('');
  });

  it('shows "Active" for activeVisitUuid when present', () => {
    const patient = makePatient({ activeVisitUuid: 'visit-uuid' });
    expect(buildPrimaryText(patient, ['activeVisitUuid'])).toBe('Active');
  });

  it('omits activeVisitUuid field when not present', () => {
    const patient = makePatient({ activeVisitUuid: null });
    expect(buildPrimaryText(patient, ['activeVisitUuid'])).toBe('');
  });

  it('converts birthDate to string when present', () => {
    const patient = makePatient({ birthDate: '1990-01-15' });
    expect(buildPrimaryText(patient, ['birthDate'])).toBe('1990-01-15');
  });
});

describe('matchesKeys', () => {
  it('matches a simple key with no modifiers', () => {
    const event = makeKeyboardEvent({ key: 'k' });
    expect(matchesKeys(event, ['k'])).toBe(true);
  });

  it('matches meta+k combination', () => {
    const event = makeKeyboardEvent({ key: 'k', metaKey: true });
    expect(matchesKeys(event, ['meta+k'])).toBe(true);
  });

  it('matches cmd+k as alias for meta+k', () => {
    const event = makeKeyboardEvent({ key: 'k', metaKey: true });
    expect(matchesKeys(event, ['cmd+k'])).toBe(true);
  });

  it('matches ctrl+k combination', () => {
    const event = makeKeyboardEvent({ key: 'k', ctrlKey: true });
    expect(matchesKeys(event, ['ctrl+k'])).toBe(true);
  });

  it('matches shift+k combination', () => {
    const event = makeKeyboardEvent({ key: 'k', shiftKey: true });
    expect(matchesKeys(event, ['shift+k'])).toBe(true);
  });

  it('matches alt+k combination', () => {
    const event = makeKeyboardEvent({ key: 'k', altKey: true });
    expect(matchesKeys(event, ['alt+k'])).toBe(true);
  });

  it('does not match when modifier key is missing', () => {
    const event = makeKeyboardEvent({ key: 'k' });
    expect(matchesKeys(event, ['meta+k'])).toBe(false);
  });

  it('does not match when key is different', () => {
    const event = makeKeyboardEvent({ key: 'j', metaKey: true });
    expect(matchesKeys(event, ['meta+k'])).toBe(false);
  });

  it('does not match when extra modifier is present', () => {
    const event = makeKeyboardEvent({ key: 'k', metaKey: true, ctrlKey: true });
    expect(matchesKeys(event, ['meta+k'])).toBe(false);
  });

  it('returns true when any key in the array matches', () => {
    const event = makeKeyboardEvent({ key: 'p', ctrlKey: true });
    expect(matchesKeys(event, ['meta+k', 'ctrl+p'])).toBe(true);
  });

  it('is case-insensitive for key matching', () => {
    const event = makeKeyboardEvent({ key: 'K' });
    expect(matchesKeys(event, ['k'])).toBe(true);
  });

  it('returns false when no keys match', () => {
    const event = makeKeyboardEvent({ key: 'x' });
    expect(matchesKeys(event, ['meta+k', 'ctrl+p'])).toBe(false);
  });
});
