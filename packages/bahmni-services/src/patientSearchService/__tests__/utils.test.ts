import { formatDate } from '../../date';
import { getCookieByName } from '../../utils';
import { PatientSearchResult } from '../models';
import {
  formatPatientName,
  formatRegistrationDate,
  formatPatientSearchResults,
  getUuidFromUserLocationCookie,
  isValidSearchTerm,
  sortPatientsByIdentifierAscending,
} from '../utils';

jest.mock('../../utils');
jest.mock('../../date');

describe('PatientSearchService Utils', () => {
  const mockTranslationFunction = jest.fn((key: string) => key);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatPatientName', () => {
    it('should format full name with all parts', () => {
      const patient: PatientSearchResult = {
        uuid: 'test-uuid',
        birthDate: 631152000000,
        extraIdentifiers: null,
        personId: 1001,
        deathDate: null,
        identifier: 'PAT001',
        addressFieldValue: '123 Main St',
        givenName: 'John',
        middleName: 'Michael',
        familyName: 'Doe',
        gender: 'M',
        dateCreated: 1577836800000,
        activeVisitUuid: null,
        customAttribute: null,
        patientProgramAttributeValue: null,
        hasBeenAdmitted: false,
        age: '34',
      };

      const result = formatPatientName(patient);
      expect(result).toBe('John Michael Doe');
    });

    it('should format name without middle name', () => {
      const patient: PatientSearchResult = {
        uuid: 'test-uuid',
        birthDate: 631152000000,
        extraIdentifiers: null,
        personId: 1001,
        deathDate: null,
        identifier: 'PAT001',
        addressFieldValue: '123 Main St',
        givenName: 'John',
        middleName: null,
        familyName: 'Doe',
        gender: 'M',
        dateCreated: 1577836800000,
        activeVisitUuid: null,
        customAttribute: null,
        patientProgramAttributeValue: null,
        hasBeenAdmitted: false,
        age: '34',
      };

      const result = formatPatientName(patient);
      expect(result).toBe('John Doe');
    });

    it('should format name with only given name', () => {
      const patient: PatientSearchResult = {
        uuid: 'test-uuid',
        birthDate: 631152000000,
        extraIdentifiers: null,
        personId: 1001,
        deathDate: null,
        identifier: 'PAT001',
        addressFieldValue: '123 Main St',
        givenName: 'John',
        middleName: null,
        familyName: '',
        gender: 'M',
        dateCreated: 1577836800000,
        activeVisitUuid: null,
        customAttribute: null,
        patientProgramAttributeValue: null,
        hasBeenAdmitted: false,
        age: '34',
      };

      const result = formatPatientName(patient);
      expect(result).toBe('John');
    });

    it('should handle empty name parts', () => {
      const patient: PatientSearchResult = {
        uuid: 'test-uuid',
        birthDate: 631152000000,
        extraIdentifiers: null,
        personId: 1001,
        deathDate: null,
        identifier: 'PAT001',
        addressFieldValue: '123 Main St',
        givenName: '',
        middleName: '',
        familyName: '',
        gender: 'M',
        dateCreated: 1577836800000,
        activeVisitUuid: null,
        customAttribute: null,
        patientProgramAttributeValue: null,
        hasBeenAdmitted: false,
        age: '34',
      };

      const result = formatPatientName(patient);
      expect(result).toBe('');
    });
  });

  describe('formatRegistrationDate', () => {
    beforeEach(() => {
      (formatDate as jest.Mock).mockReturnValue({
        formattedResult: '01/01/2020',
      });
    });

    it('should format valid timestamp', () => {
      const timestamp = 1577836800000; // 2020-01-01
      const result = formatRegistrationDate(timestamp, mockTranslationFunction);

      expect(formatDate).toHaveBeenCalledWith(
        new Date(timestamp).toISOString(),
        mockTranslationFunction,
      );
      expect(result).toBe('01/01/2020');
    });

    it('should handle invalid timestamp', () => {
      (formatDate as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid date');
      });

      const result = formatRegistrationDate(NaN, mockTranslationFunction);
      expect(result).toBe('Invalid Date');
    });

    it('should handle formatDate returning null', () => {
      (formatDate as jest.Mock).mockReturnValue({
        formattedResult: null,
      });

      const timestamp = 1577836800000;
      const result = formatRegistrationDate(timestamp, mockTranslationFunction);
      expect(result).toBe('Invalid Date');
    });
  });

  describe('formatPatientSearchResults', () => {
    const mockPatients: PatientSearchResult[] = [
      {
        uuid: 'uuid-1',
        birthDate: 631152000000,
        extraIdentifiers: null,
        personId: 1001,
        deathDate: null,
        identifier: 'PAT001',
        addressFieldValue: '123 Main St',
        givenName: 'John',
        middleName: null,
        familyName: 'Doe',
        gender: 'M',
        dateCreated: 1577836800000,
        activeVisitUuid: null,
        customAttribute: null,
        patientProgramAttributeValue: null,
        hasBeenAdmitted: false,
        age: '34',
      },
      {
        uuid: 'uuid-2',
        birthDate: 662688000000,
        extraIdentifiers: null,
        personId: 1002,
        deathDate: null,
        identifier: 'PAT002',
        addressFieldValue: '456 Oak Ave',
        givenName: 'Jane',
        middleName: null,
        familyName: 'Smith',
        gender: 'F',
        dateCreated: 1609459200000,
        activeVisitUuid: null,
        customAttribute: null,
        patientProgramAttributeValue: null,
        hasBeenAdmitted: false,
        age: '33',
      },
    ];

    beforeEach(() => {
      (formatDate as jest.Mock).mockReturnValue({
        formattedResult: '01/01/2020',
      });
    });

    it('should format array of patient search results', () => {
      const result = formatPatientSearchResults(
        mockPatients,
        mockTranslationFunction,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'uuid-1',
        patientId: 'PAT001',
        fullName: 'John Doe',
        phoneNumber: null,
        alternatePhoneNumber: null,
        gender: 'M',
        age: '34',
        registrationDate: '01/01/2020',
        uuid: 'uuid-1',
      });
      expect(result[1]).toEqual({
        id: 'uuid-2',
        patientId: 'PAT002',
        fullName: 'Jane Smith',
        phoneNumber: null,
        alternatePhoneNumber: null,
        gender: 'F',
        age: '33',
        registrationDate: '01/01/2020',
        uuid: 'uuid-2',
      });
    });

    it('should handle empty array', () => {
      const result = formatPatientSearchResults([], mockTranslationFunction);
      expect(result).toEqual([]);
    });
  });

  describe('getUuidFromUserLocationCookie', () => {
    beforeEach(() => {
      (getCookieByName as jest.Mock).mockClear();
    });

    it('should extract UUID from valid cookie', () => {
      const mockLocationData = {
        uuid: 'location-uuid-123',
        name: 'Test Location',
      };
      (getCookieByName as jest.Mock).mockReturnValue(
        encodeURIComponent(JSON.stringify(mockLocationData)),
      );

      const result = getUuidFromUserLocationCookie();
      expect(result).toBe('location-uuid-123');
    });

    it('should return null when cookie is not found', () => {
      (getCookieByName as jest.Mock).mockReturnValue(null);

      const result = getUuidFromUserLocationCookie();
      expect(result).toBeNull();
    });

    it('should return null when cookie contains invalid JSON', () => {
      (getCookieByName as jest.Mock).mockReturnValue('invalid-json');

      const result = getUuidFromUserLocationCookie();
      expect(result).toBeNull();
    });

    it('should return null when cookie JSON does not contain uuid', () => {
      const mockLocationData = { name: 'Test Location' };
      (getCookieByName as jest.Mock).mockReturnValue(
        encodeURIComponent(JSON.stringify(mockLocationData)),
      );

      const result = getUuidFromUserLocationCookie();
      expect(result).toBeNull();
    });

    it('should handle decoding errors gracefully', () => {
      (getCookieByName as jest.Mock).mockReturnValue('%invalid%');

      const result = getUuidFromUserLocationCookie();
      expect(result).toBeNull();
    });
  });

  describe('isValidSearchTerm', () => {
    it('should return true for valid search terms', () => {
      expect(isValidSearchTerm('John Doe')).toBe(true);
      expect(isValidSearchTerm('PAT001')).toBe(true);
      expect(isValidSearchTerm('123')).toBe(true);
      expect(isValidSearchTerm('a')).toBe(true);
    });

    it('should return false for empty or whitespace-only search terms', () => {
      expect(isValidSearchTerm('')).toBe(false);
      expect(isValidSearchTerm('   ')).toBe(false);
      expect(isValidSearchTerm('\t\n')).toBe(false);
    });

    it('should handle search terms with leading/trailing whitespace', () => {
      expect(isValidSearchTerm('  John Doe  ')).toBe(true);
      expect(isValidSearchTerm('\tPAT001\n')).toBe(true);
    });
  });

  describe('sortPatientsByIdentifierAscending', () => {
    const mockPatientsForSorting: PatientSearchResult[] = [
      {
        uuid: 'uuid-3',
        birthDate: 694224000000,
        extraIdentifiers: null,
        personId: 1003,
        deathDate: null,
        identifier: 'ABC200000',
        addressFieldValue: '789 Pine St',
        givenName: 'Robert',
        middleName: null,
        familyName: 'Johnson',
        gender: 'M',
        dateCreated: 1640995200000,
        activeVisitUuid: null,
        customAttribute: null,
        patientProgramAttributeValue: null,
        hasBeenAdmitted: false,
        age: '32',
      },
      {
        uuid: 'uuid-1',
        birthDate: 631152000000,
        extraIdentifiers: null,
        personId: 1001,
        deathDate: null,
        identifier: 'ABC200',
        addressFieldValue: '123 Main St',
        givenName: 'John',
        middleName: null,
        familyName: 'Doe',
        gender: 'M',
        dateCreated: 1577836800000,
        activeVisitUuid: null,
        customAttribute: null,
        patientProgramAttributeValue: null,
        hasBeenAdmitted: false,
        age: '34',
      },
      {
        uuid: 'uuid-5',
        birthDate: 757296000000,
        extraIdentifiers: null,
        personId: 1005,
        deathDate: null,
        identifier: 'DEF456',
        addressFieldValue: '555 Maple Ave',
        givenName: 'Michael',
        middleName: null,
        familyName: 'Wilson',
        gender: 'M',
        dateCreated: 1704067200000,
        activeVisitUuid: null,
        customAttribute: null,
        patientProgramAttributeValue: null,
        hasBeenAdmitted: false,
        age: '30',
      },
      {
        uuid: 'uuid-2',
        birthDate: 662688000000,
        extraIdentifiers: null,
        personId: 1002,
        deathDate: null,
        identifier: 'ABC20000',
        addressFieldValue: '456 Oak Ave',
        givenName: 'Jane',
        middleName: null,
        familyName: 'Smith',
        gender: 'F',
        dateCreated: 1609459200000,
        activeVisitUuid: null,
        customAttribute: null,
        patientProgramAttributeValue: null,
        hasBeenAdmitted: false,
        age: '33',
      },
    ];

    it('should sort patients by identifier in ascending order', () => {
      const result = sortPatientsByIdentifierAscending(mockPatientsForSorting);

      expect(result).toHaveLength(4);
      expect(result[0].identifier).toBe('ABC200');
      expect(result[1].identifier).toBe('ABC20000');
      expect(result[2].identifier).toBe('ABC200000');
      expect(result[3].identifier).toBe('DEF456');
    });

    it('should handle numeric sorting correctly', () => {
      const patientsWithNumbers: PatientSearchResult[] = [
        { ...mockPatientsForSorting[0], identifier: 'PAT10' },
        { ...mockPatientsForSorting[1], identifier: 'PAT2' },
        { ...mockPatientsForSorting[2], identifier: 'PAT1' },
        { ...mockPatientsForSorting[3], identifier: 'PAT20' },
      ];

      const result = sortPatientsByIdentifierAscending(patientsWithNumbers);

      expect(result[0].identifier).toBe('PAT1');
      expect(result[1].identifier).toBe('PAT2');
      expect(result[2].identifier).toBe('PAT10');
      expect(result[3].identifier).toBe('PAT20');
    });

    it('should handle case-insensitive sorting', () => {
      const patientsWithMixedCase: PatientSearchResult[] = [
        { ...mockPatientsForSorting[0], identifier: 'abc200' },
        { ...mockPatientsForSorting[1], identifier: 'ABC100' },
        { ...mockPatientsForSorting[2], identifier: 'AbC150' },
      ];

      const result = sortPatientsByIdentifierAscending(patientsWithMixedCase);

      expect(result[0].identifier).toBe('ABC100');
      expect(result[1].identifier).toBe('AbC150');
      expect(result[2].identifier).toBe('abc200');
    });

    it('should handle empty array', () => {
      const result = sortPatientsByIdentifierAscending([]);
      expect(result).toEqual([]);
    });

    it('should handle null/undefined input', () => {
      expect(sortPatientsByIdentifierAscending(null as any)).toBeNull();
      expect(
        sortPatientsByIdentifierAscending(undefined as any),
      ).toBeUndefined();
    });

    it('should handle mixed alphanumeric identifiers', () => {
      const mixedIdentifiers: PatientSearchResult[] = [
        { ...mockPatientsForSorting[0], identifier: 'Z100' },
        { ...mockPatientsForSorting[1], identifier: 'A200' },
        { ...mockPatientsForSorting[2], identifier: 'B50' },
        { ...mockPatientsForSorting[3], identifier: 'A100' },
      ];

      const result = sortPatientsByIdentifierAscending(mixedIdentifiers);

      expect(result[0].identifier).toBe('A100');
      expect(result[1].identifier).toBe('A200');
      expect(result[2].identifier).toBe('B50');
      expect(result[3].identifier).toBe('Z100');
    });
  });
});
