import { Patient } from 'fhir/r4';
import { get, post } from '../../api';
import { APP_PROPERTY_URL } from '../../applicationConfigService/constants';
import { getUserLoginLocation } from '../../userService';
import {
  PATIENT_RESOURCE_URL,
  PATIENT_LUCENE_SEARCH_URL,
  PATIENT_CUSTOM_ATTRIBUTE_SEARCH_URL,
  IDENTIFIER_TYPES_URL,
  APP_SETTINGS_URL,
  PRIMARY_IDENTIFIER_TYPE_PROPERTY,
  CREATE_PATIENT_URL,
  ADDRESS_HIERARCHY_URL,
} from '../constants';
import {
  getPatientById,
  formatPatientName,
  formatPatientAddress,
  formatPatientContact,
  formatPatientData,
  searchPatientByNameOrId,
  searchPatientByCustomAttribute,
  getFormattedPatientById,
  getPrimaryIdentifierType,
  getIdentifierData,
  createPatient,
  getGenders,
  getAddressHierarchyEntries,
  getPatientImageAsDataUrl,
  getPatientProfile,
} from '../patientService';

// Mock the api module
jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;
const mockedPost = post as jest.MockedFunction<typeof post>;
jest.mock('../../userService');
const mockGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;

describe('Patient Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatientById', () => {
    it('should call get with the correct patient URL', async () => {
      // Arrange
      const patientUUID = '12345678-1234-1234-1234-123456789abc';
      const mockPatient = { resourceType: 'Patient', id: patientUUID };
      mockedGet.mockResolvedValueOnce(mockPatient);

      // Act
      const result = await getPatientById(patientUUID);

      // Assert
      expect(mockedGet).toHaveBeenCalledWith(PATIENT_RESOURCE_URL(patientUUID));
      expect(result).toEqual(mockPatient);
    });

    it('should propagate errors from the API', async () => {
      // Arrange
      const patientUUID = '12345678-1234-1234-1234-123456789abc';
      const mockError = new Error('API Error');
      mockedGet.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(getPatientById(patientUUID)).rejects.toThrow('API Error');
      expect(mockedGet).toHaveBeenCalledWith(PATIENT_RESOURCE_URL(patientUUID));
    });

    it('should throw error for empty UUID', async () => {
      // Act & Assert
      await expect(getPatientById('')).rejects.toThrow(
        'Invalid patient UUID: UUID cannot be empty',
      );
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only UUID', async () => {
      // Act & Assert
      await expect(getPatientById('   ')).rejects.toThrow(
        'Invalid patient UUID: UUID cannot be empty',
      );
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('should throw error for invalid UUID format', async () => {
      // Arrange
      const invalidUUID = 'not-a-valid-uuid';

      // Act & Assert
      await expect(getPatientById(invalidUUID)).rejects.toThrow(
        'Invalid patient UUID format: not-a-valid-uuid',
      );
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('should throw error for UUID with invalid characters', async () => {
      // Arrange
      const invalidUUID = '12345678-1234-1234-1234-12345678ZZZZ';

      // Act & Assert
      await expect(getPatientById(invalidUUID)).rejects.toThrow(
        'Invalid patient UUID format',
      );
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('should accept valid UUID with uppercase letters', async () => {
      // Arrange
      const patientUUID = '12345678-1234-1234-1234-123456789ABC';
      const mockPatient = { resourceType: 'Patient', id: patientUUID };
      mockedGet.mockResolvedValueOnce(mockPatient);

      // Act
      const result = await getPatientById(patientUUID);

      // Assert
      expect(mockedGet).toHaveBeenCalledWith(PATIENT_RESOURCE_URL(patientUUID));
      expect(result).toEqual(mockPatient);
    });

    it('should accept valid UUID with lowercase letters', async () => {
      // Arrange
      const patientUUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const mockPatient = { resourceType: 'Patient', id: patientUUID };
      mockedGet.mockResolvedValueOnce(mockPatient);

      // Act
      const result = await getPatientById(patientUUID);

      // Assert
      expect(mockedGet).toHaveBeenCalledWith(PATIENT_RESOURCE_URL(patientUUID));
      expect(result).toEqual(mockPatient);
    });
  });

  describe('searchPatientByNameOrId', () => {
    it('should call get with the correct patient URL', async () => {
      const searchTerm = 'ABC200003';
      const mockLocationDetails = {
        name: 'Emergency',
        uuid: 'b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e',
      };
      const mockPatientSearchResultBundle = {
        totalCount: 1,
        pageOfResults: [
          {
            uuid: '3e991686-4cab-443e-a03d-ffa40756a965',
            extraIdentifiers: null,
            personId: 13,
            deathDate: null,
            identifier: 'ABC200003',
            addressFieldValue: null,
            givenName: 'Jake',
            middleName: 'Charlie',
            familyName: 'Smith',
            gender: 'M',
            dateCreated: 1744775604000,
            activeVisitUuid: null,
            customAttribute:
              '{"phoneNumber" : "8645973159","alternatePhoneNumber" : "7548621593","email":"jake@example.com"}',
            patientProgramAttributeValue: null,
            hasBeenAdmitted: false,
            age: '57 years 8 months',
            birthDate: '16 Feb 1968',
          },
        ],
      };
      mockedGet.mockResolvedValueOnce(mockPatientSearchResultBundle);
      mockGetUserLoginLocation.mockReturnValue(mockLocationDetails);
      const result = await searchPatientByNameOrId(searchTerm);

      expect(mockedGet).toHaveBeenCalledWith(
        PATIENT_LUCENE_SEARCH_URL(
          searchTerm,
          'b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e',
        ),
      );
      expect(result).toEqual(mockPatientSearchResultBundle);
    });
  });

  describe('formatPatientName', () => {
    it('should format patient name correctly', () => {
      // Arrange
      const patient = {
        resourceType: 'Patient' as const,
        name: [{ given: ['John'], family: 'Doe' }],
      };

      // Act
      const result = formatPatientName(patient);

      // Assert
      expect(result).toBe('John Doe');
    });

    it('should handle multiple given names', () => {
      // Arrange
      const patient = {
        resourceType: 'Patient' as const,
        name: [{ given: ['John', 'Robert'], family: 'Doe' }],
      };

      // Act
      const result = formatPatientName(patient);

      // Assert
      expect(result).toBe('John Robert Doe');
    });

    it('should handle missing family name', () => {
      // Arrange
      const patient = {
        resourceType: 'Patient' as const,
        name: [{ given: ['John'] }],
      };

      // Act
      const result = formatPatientName(patient);

      // Assert
      expect(result).toBe('John');
    });

    it('should handle missing given name', () => {
      // Arrange
      const patient = {
        resourceType: 'Patient' as const,
        name: [{ family: 'Doe' }],
      };

      // Act
      const result = formatPatientName(patient);

      // Assert
      expect(result).toBe('Doe');
    });

    it('should return null for empty name array', () => {
      // Arrange
      const patient = {
        resourceType: 'Patient' as const,
        name: [],
      };

      // Act
      const result = formatPatientName(patient);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for missing name property', () => {
      // Arrange
      const patient = {
        resourceType: 'Patient' as const,
      };

      // Act
      const result = formatPatientName(patient);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for empty name object', () => {
      // Arrange
      const patient = {
        resourceType: 'Patient' as const,
        name: [{}],
      };

      // Act
      const result = formatPatientName(patient);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('formatPatientAddress', () => {
    it('should format address correctly', () => {
      // Arrange
      const address = {
        line: ['123 Main St'],
        city: 'Boston',
        state: 'MA',
        postalCode: '02115',
      };

      // Act
      const result = formatPatientAddress(address);

      // Assert
      expect(result).toBe('123 Main St, Boston, MA 02115');
    });

    it('should handle multiple address lines', () => {
      // Arrange
      const address = {
        line: ['123 Main St', 'Apt 4B'],
        city: 'Boston',
        state: 'MA',
        postalCode: '02115',
      };

      // Act
      const result = formatPatientAddress(address);

      // Assert
      expect(result).toBe('123 Main St, Apt 4B, Boston, MA 02115');
    });

    it('should handle missing fields', () => {
      // Arrange
      const address = {
        line: ['123 Main St'],
        city: 'Boston',
        // Missing state and postalCode
      };

      // Act
      const result = formatPatientAddress(address);

      // Assert
      expect(result).toBe('123 Main St, Boston');
    });

    it('should handle only city and state', () => {
      // Arrange
      const address = {
        city: 'Boston',
        state: 'MA',
      };

      // Act
      const result = formatPatientAddress(address);

      // Assert
      expect(result).toBe('Boston, MA');
    });

    it('should handle only line and postalCode', () => {
      // Arrange
      const address = {
        line: ['123 Main St'],
        postalCode: '02115',
      };

      // Act
      const result = formatPatientAddress(address);

      // Assert
      expect(result).toBe('123 Main St, 02115');
    });

    it('should handle empty strings for all fields', () => {
      // Arrange
      const address = {
        line: [''],
        city: '',
        state: '',
        postalCode: '',
      };

      // Act
      const result = formatPatientAddress(address);

      // Assert
      expect(result).toBeNull();
    });

    it('should clean up extra commas and spaces', () => {
      // Arrange
      const address = {
        line: ['123 Main St'],
        city: '',
        state: 'MA',
        postalCode: '',
      };

      // Act
      const result = formatPatientAddress(address);

      // Assert
      expect(result).toBe('123 Main St, MA');
    });

    it('should return null for undefined address', () => {
      // Act
      const result = formatPatientAddress(undefined);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for empty address object', () => {
      // Arrange
      const address = {};

      // Act
      const result = formatPatientAddress(address);

      // Assert
      expect(result).toBeNull();
    });

    it('should include address extensions in the formatted address', () => {
      // Arrange
      const address = {
        line: ['123 Main St'],
        city: 'Boston',
        extension: [
          {
            url: 'http://example.org/fhir/StructureDefinition/address-details',
            extension: [
              {
                url: 'http://example.org/fhir/StructureDefinition/address-ward',
                valueString: 'Ward 12',
              },
              {
                url: 'http://example.org/fhir/StructureDefinition/address-village',
                valueString: 'Downtown',
              },
            ],
          },
        ],
      };

      // Act
      const result = formatPatientAddress(address);

      // Assert
      expect(result).toBe('123 Main St, Ward 12, Downtown, Boston');
    });

    it('should handle address with empty extensions array', () => {
      // Arrange
      const address = {
        line: ['123 Main St'],
        city: 'Boston',
        extension: [],
      };

      // Act
      const result = formatPatientAddress(address);

      // Assert
      expect(result).toBe('123 Main St, Boston');
    });

    it('should handle address with malformed extensions', () => {
      // Arrange
      const address = {
        line: ['123 Main St'],
        city: 'Boston',
        extension: [
          {
            url: 'http://example.org/fhir/StructureDefinition/address-details',
            // Missing nested extension array
          },
        ],
      };

      // Act
      const result = formatPatientAddress(address);

      // Assert
      expect(result).toBe('123 Main St, Boston');
    });

    it('should handle address with nested extensions but no valueString', () => {
      // Arrange
      const address = {
        line: ['123 Main St'],
        city: 'Boston',
        extension: [
          {
            url: 'http://example.org/fhir/StructureDefinition/address-details',
            extension: [
              {
                url: 'http://example.org/fhir/StructureDefinition/address-ward',
                // Missing valueString
              },
            ],
          },
        ],
      };

      // Act
      const result = formatPatientAddress(address);

      // Assert
      expect(result).toBe('123 Main St, Boston');
    });

    it('should handle address with multiple extension groups', () => {
      // Arrange
      const address = {
        line: ['123 Main St'],
        city: 'Boston',
        extension: [
          {
            url: 'http://example.org/fhir/StructureDefinition/address-details',
            extension: [
              {
                url: 'http://example.org/fhir/StructureDefinition/address-ward',
                valueString: 'Ward 12',
              },
            ],
          },
          {
            url: 'http://example.org/fhir/StructureDefinition/address-more-details',
            extension: [
              {
                url: 'http://example.org/fhir/StructureDefinition/address-landmark',
                valueString: 'Near Hospital',
              },
            ],
          },
        ],
      };

      // Act
      const result = formatPatientAddress(address);

      // Assert
      expect(result).toBe('123 Main St, Ward 12, Near Hospital, Boston');
    });

    it('should handle non-array extension property', () => {
      // Arrange
      const address = {
        line: ['123 Main St'],
        city: 'Boston',

        extension: 'invalid' as any, // Intentionally incorrect type
      };

      // Act
      const result = formatPatientAddress(address);

      // Assert
      expect(result).toBe('123 Main St, Boston');
    });
  });

  describe('formatPatientContact', () => {
    it('should format telecom correctly', () => {
      // Arrange
      const telecom = {
        system: 'phone' as const,
        value: '555-123-4567',
      };

      // Act
      const result = formatPatientContact(telecom);

      // Assert
      expect(result).toBe('phone: 555-123-4567');
    });

    it('should return null for undefined telecom', () => {
      // Act
      const result = formatPatientContact(undefined);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for missing system', () => {
      // Arrange
      const telecom = {
        value: '555-123-4567',
      };

      // Act
      const result = formatPatientContact(telecom);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for missing value', () => {
      // Arrange
      const telecom = {
        system: 'phone' as const,
      };

      // Act
      const result = formatPatientContact(telecom);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('formatPatientData', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers().setSystemTime(new Date('2025-03-24'));
    });
    it('should format complete patient data correctly', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        name: [{ given: ['John'], family: 'Doe' }],
        gender: 'male',
        birthDate: '1990-01-01',
        address: [
          {
            line: ['123 Main St'],
            city: 'Boston',
            state: 'MA',
            postalCode: '02115',
          },
        ],
        identifier: [
          {
            type: {
              text: 'MRN',
            },
            value: '123456',
          },
        ],
        telecom: [
          {
            system: 'phone',
            value: '555-123-4567',
          },
        ],
      };

      // Act
      const result = formatPatientData(patient);
      const identifier = new Map<string, string>();
      identifier.set('MRN', '123456');

      // Assert
      expect(result).toEqual({
        id: 'test-uuid',
        fullName: 'John Doe',
        gender: 'male',
        birthDate: '1990-01-01',
        formattedAddress: '123 Main St, Boston, MA 02115',
        formattedContact: 'phone: 555-123-4567',
        age: {
          days: 23,
          months: 2,
          years: 35,
        },
        identifiers: identifier,
      });
    });

    it('should handle patient with minimal data', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result).toEqual({
        id: 'test-uuid',
        fullName: null,
        gender: null,
        birthDate: null,
        formattedAddress: null,
        formattedContact: null,
        age: null,
        identifiers: new Map<string, string>(),
      });
    });

    it('should handle patient with undefined id', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result.id).toBe('');
    });

    it('should handle invalid identifier', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        name: [{ given: ['John'], family: 'Doe' }],
        gender: 'male',
        birthDate: '1990-01-01',
        address: [
          {
            line: ['123 Main St'],
            city: 'Boston',
            state: 'MA',
            postalCode: '02115',
          },
        ],
        identifier: [
          {
            value: '123456',
          },
        ],
        telecom: [
          {
            system: 'phone',
            value: '555-123-4567',
          },
        ],
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result).toEqual({
        id: 'test-uuid',
        fullName: 'John Doe',
        gender: 'male',
        birthDate: '1990-01-01',
        formattedAddress: '123 Main St, Boston, MA 02115',
        formattedContact: 'phone: 555-123-4567',
        age: {
          days: 23,
          months: 2,
          years: 35,
        },
        identifiers: new Map<string, string>(),
      });
    });

    it('should handle patient with empty address array', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        address: [],
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result.formattedAddress).toBeNull();
    });

    it('should handle patient with empty telecom array', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        telecom: [],
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result.formattedContact).toBeNull();
    });

    it('should use the first address when multiple are provided', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        address: [
          {
            line: ['123 Main St'],
            city: 'Boston',
            state: 'MA',
            postalCode: '02115',
          },
          {
            line: ['456 Second St'],
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
          },
        ],
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result.formattedAddress).toBe('123 Main St, Boston, MA 02115');
    });

    it('should use the first telecom when multiple are provided', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        telecom: [
          {
            system: 'phone',
            value: '555-123-4567',
          },
          {
            system: 'email',
            value: 'john.doe@example.com',
          },
        ],
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result.formattedContact).toBe('phone: 555-123-4567');
    });

    it('should handle malformed address data', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        address: [{}], // Empty address object
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result.formattedAddress).toBeNull();
    });

    it('should handle malformed telecom data', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        telecom: [{}], // Empty telecom object
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result.formattedContact).toBeNull();
    });

    it('should handle patient with address extensions', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        address: [
          {
            line: ['123 Main St'],
            city: 'Boston',
            extension: [
              {
                url: 'http://example.org/fhir/StructureDefinition/address-details',
                extension: [
                  {
                    url: 'http://example.org/fhir/StructureDefinition/address-ward',
                    valueString: 'Ward 12',
                  },
                ],
              },
            ],
          },
        ],
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result.formattedAddress).toBe('123 Main St, Ward 12, Boston');
    });

    it('should handle patient with multiple identifiers', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        identifier: [
          {
            type: {
              text: 'MRN',
            },
            value: '123456',
          },
          {
            type: {
              text: 'SSN',
            },
            value: '999-99-9999',
          },
          {
            // Invalid identifier without type
            value: 'ABC123',
          },
        ],
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      const expectedIdentifiers = new Map<string, string>();
      expectedIdentifiers.set('MRN', '123456');
      expectedIdentifiers.set('SSN', '999-99-9999');

      expect(result.identifiers).toEqual(expectedIdentifiers);
      expect(result.identifiers.size).toBe(2);
    });

    it('should handle patient with empty identifier array', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        identifier: [],
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result.identifiers).toEqual(new Map<string, string>());
      expect(result.identifiers.size).toBe(0);
    });

    it('should handle patient with invalid birthDate format', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        birthDate: 'invalid-date', // Invalid date format
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result.age).toBeNull();
    });

    it('should handle patient with future birthDate', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        birthDate: '2030-01-01', // Future date
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result.age).toBeNull();
    });

    it('should handle patient with identifier that has no value', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        identifier: [
          {
            type: {
              text: 'MRN',
            },
            // Missing value
          } as any, // Intentionally incorrect type
        ],
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result.identifiers.size).toBe(0);
    });

    it('should handle patient with identifier that has empty type text', () => {
      // Arrange
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'test-uuid',
        identifier: [
          {
            type: {
              text: '', // Empty text
            },
            value: '123456',
          },
        ],
      };

      // Act
      const result = formatPatientData(patient);

      // Assert
      expect(result.identifiers.size).toBe(0);
    });
  });

  describe('searchPatientByCustomAttribute', () => {
    const mockSearchTerm = '1234567890';
    const mockLoginLocationUuid = 'b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e';
    const mockSearchFields = ['phoneNumber'];
    const mockAllCustomFields = [
      {
        translationKey: 'PHONE_NUMBER',
        fields: ['phoneNumber', 'alternatePhoneNumber'],
        columnTranslationKeys: ['PHONE', 'ALT_PHONE'],
        type: 'person' as const,
      },
      {
        translationKey: 'EMAIL',
        fields: ['email'],
        columnTranslationKeys: ['EMAIL'],
        type: 'person' as const,
      },
    ];
    const t = (k: string) => k;

    const mockPatientSearchResponse = {
      totalCount: 1,
      pageOfResults: [
        {
          uuid: '3e991686-4cab-443e-a03d-ffa40756a965',
          birthDate: '16 Feb 1968',
          extraIdentifiers: null,
          personId: 13,
          deathDate: null,
          identifier: 'ABC200003',
          addressFieldValue: null,
          givenName: 'Jake',
          middleName: 'Charlie',
          familyName: 'Smith',
          gender: 'M',
          dateCreated: 1744775604000,
          activeVisitUuid: null,
          customAttribute:
            '{"phoneNumber" : "8645973159","alternatePhoneNumber" : "7548621593"}',
          patientProgramAttributeValue: null,
          hasBeenAdmitted: false,
          age: '57 years 1 months',
        },
      ],
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockGetUserLoginLocation.mockReturnValue({
        name: 'Emergency',
        uuid: mockLoginLocationUuid,
      });
    });

    it('searches by custom attributes using the correct URL', async () => {
      mockedGet.mockResolvedValueOnce(mockPatientSearchResponse);

      const result = await searchPatientByCustomAttribute(
        mockSearchTerm,
        'person',
        mockSearchFields,
        mockAllCustomFields,
        t,
      );

      expect(mockGetUserLoginLocation).toHaveBeenCalled();
      expect(mockedGet).toHaveBeenCalledWith(
        PATIENT_CUSTOM_ATTRIBUTE_SEARCH_URL(
          mockSearchTerm,
          'person',
          mockSearchFields,
          mockAllCustomFields,
          mockLoginLocationUuid,
        ),
      );
      expect(result).toEqual(mockPatientSearchResponse);
    });

    it('builds URL with separate search and result fields', async () => {
      mockedGet.mockResolvedValueOnce(mockPatientSearchResponse);
      const searchFields = ['phoneNumber'];
      const resultFields = [
        {
          translationKey: 'PHONE_NUMBER',
          fields: ['phoneNumber', 'alternatePhoneNumber'],
          columnTranslationKeys: ['PHONE', 'ALT_PHONE'],
          type: 'person' as const,
        },
        {
          translationKey: 'EMAIL',
          fields: ['email'],
          columnTranslationKeys: ['EMAIL'],
          type: 'person' as const,
        },
      ];

      await searchPatientByCustomAttribute(
        mockSearchTerm,
        'person',
        searchFields,
        resultFields,
        t,
      );

      const expectedUrl = PATIENT_CUSTOM_ATTRIBUTE_SEARCH_URL(
        mockSearchTerm,
        'person',
        searchFields,
        resultFields,
        mockLoginLocationUuid,
      );
      expect(mockedGet).toHaveBeenCalledWith(expectedUrl);
    });

    it('passes trimmed search term to URL builder', async () => {
      mockedGet.mockResolvedValueOnce(mockPatientSearchResponse);
      const searchTermWithSpaces = `  ${mockSearchTerm}  `;

      await searchPatientByCustomAttribute(
        searchTermWithSpaces,
        'person',
        mockSearchFields,
        mockAllCustomFields,
        t,
      );

      // The URL builder should receive the original term with spaces,
      // as trimming is handled inside the URL builder function
      const expectedUrl = PATIENT_CUSTOM_ATTRIBUTE_SEARCH_URL(
        searchTermWithSpaces,
        'person',
        mockSearchFields,
        mockAllCustomFields,
        mockLoginLocationUuid,
      );
      expect(mockedGet).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('getFormattedPatientById', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers().setSystemTime(new Date('2025-03-24'));
    });

    it('should fetch patient by UUID and return formatted data', async () => {
      // Arrange
      const patientUUID = '12345678-1234-1234-1234-123456789abc';
      const mockPatient: Patient = {
        resourceType: 'Patient',
        id: patientUUID,
        name: [{ given: ['John'], family: 'Doe' }],
        gender: 'male',
        birthDate: '1990-01-01',
        address: [
          {
            line: ['123 Main St'],
            city: 'Boston',
            state: 'MA',
            postalCode: '02115',
          },
        ],
        identifier: [
          {
            type: {
              text: 'MRN',
            },
            value: '123456',
          },
        ],
        telecom: [
          {
            system: 'phone',
            value: '555-123-4567',
          },
        ],
      };
      mockedGet.mockResolvedValueOnce(mockPatient);

      // Act
      const result = await getFormattedPatientById(patientUUID);

      // Assert
      expect(mockedGet).toHaveBeenCalledWith(PATIENT_RESOURCE_URL(patientUUID));
      expect(result).toEqual({
        id: patientUUID,
        fullName: 'John Doe',
        gender: 'male',
        birthDate: '1990-01-01',
        formattedAddress: '123 Main St, Boston, MA 02115',
        formattedContact: 'phone: 555-123-4567',
        age: {
          days: 23,
          months: 2,
          years: 35,
        },
        identifiers: new Map([['MRN', '123456']]),
      });
    });

    it('should propagate errors from getPatientById', async () => {
      // Arrange
      const patientUUID = '12345678-1234-1234-1234-123456789abc';
      const mockError = new Error('Patient not found');
      mockedGet.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(getFormattedPatientById(patientUUID)).rejects.toThrow(
        'Patient not found',
      );
    });
  });

  describe('getPrimaryIdentifierType', () => {
    it('should return primary identifier type UUID', async () => {
      // Arrange
      const mockSettings = [
        {
          property: PRIMARY_IDENTIFIER_TYPE_PROPERTY,
          value: 'uuid-123-456',
        },
        {
          property: 'other.property',
          value: 'other-value',
        },
      ];
      mockedGet.mockResolvedValueOnce(mockSettings);

      // Act
      const result = await getPrimaryIdentifierType();

      // Assert
      expect(mockedGet).toHaveBeenCalledWith(APP_SETTINGS_URL('core'));
      expect(result).toBe('uuid-123-456');
    });

    it('should return null when primary identifier type not found', async () => {
      // Arrange
      const mockSettings = [
        {
          property: 'other.property',
          value: 'other-value',
        },
      ];
      mockedGet.mockResolvedValueOnce(mockSettings);

      // Act
      const result = await getPrimaryIdentifierType();

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when settings array is empty', async () => {
      // Arrange
      mockedGet.mockResolvedValueOnce([]);

      // Act
      const result = await getPrimaryIdentifierType();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getIdentifierData', () => {
    it('should return identifier data with prefixes and sources', async () => {
      // Arrange
      const mockIdentifierTypes = [
        {
          uuid: 'primary-uuid',
          name: 'Primary ID',
          identifierSources: [
            {
              uuid: 'source-1',
              prefix: 'ABC',
            },
            {
              uuid: 'source-2',
              prefix: 'XYZ',
            },
          ],
        },
        {
          uuid: 'other-uuid',
          name: 'Other ID',
          identifierSources: [],
        },
      ];
      const mockSettings = [
        {
          property: PRIMARY_IDENTIFIER_TYPE_PROPERTY,
          value: 'primary-uuid',
        },
      ];

      mockedGet.mockResolvedValueOnce(mockIdentifierTypes);
      mockedGet.mockResolvedValueOnce(mockSettings);

      // Act
      const result = await getIdentifierData();

      // Assert
      expect(mockedGet).toHaveBeenNthCalledWith(1, IDENTIFIER_TYPES_URL);
      expect(mockedGet).toHaveBeenNthCalledWith(2, APP_SETTINGS_URL('core'));
      expect(result).toEqual({
        prefixes: ['ABC', 'XYZ'],
        sourcesByPrefix: new Map([
          ['ABC', 'source-1'],
          ['XYZ', 'source-2'],
        ]),
        primaryIdentifierTypeUuid: 'primary-uuid',
      });
    });

    it('should return empty data when no primary identifier type found', async () => {
      // Arrange
      const mockIdentifierTypes: any[] = [];
      const mockSettings: any[] = [];

      mockedGet.mockResolvedValueOnce(mockIdentifierTypes);
      mockedGet.mockResolvedValueOnce(mockSettings);

      // Act
      const result = await getIdentifierData();

      // Assert
      expect(result).toEqual({
        prefixes: [],
        sourcesByPrefix: new Map(),
        primaryIdentifierTypeUuid: null,
      });
    });

    it('should return primary UUID but empty prefixes when identifier type not found', async () => {
      // Arrange
      const mockIdentifierTypes = [
        {
          uuid: 'other-uuid',
          name: 'Other ID',
          identifierSources: [],
        },
      ];
      const mockSettings = [
        {
          property: PRIMARY_IDENTIFIER_TYPE_PROPERTY,
          value: 'primary-uuid',
        },
      ];

      mockedGet.mockResolvedValueOnce(mockIdentifierTypes);
      mockedGet.mockResolvedValueOnce(mockSettings);

      // Act
      const result = await getIdentifierData();

      // Assert
      expect(result).toEqual({
        prefixes: [],
        sourcesByPrefix: new Map(),
        primaryIdentifierTypeUuid: 'primary-uuid',
      });
    });

    it('should handle identifier sources without prefixes', async () => {
      // Arrange
      const mockIdentifierTypes = [
        {
          uuid: 'primary-uuid',
          name: 'Primary ID',
          identifierSources: [
            {
              uuid: 'source-1',
              // No prefix
            },
            {
              uuid: 'source-2',
              prefix: 'XYZ',
            },
          ],
        },
      ];
      const mockSettings = [
        {
          property: PRIMARY_IDENTIFIER_TYPE_PROPERTY,
          value: 'primary-uuid',
        },
      ];

      mockedGet.mockResolvedValueOnce(mockIdentifierTypes);
      mockedGet.mockResolvedValueOnce(mockSettings);

      // Act
      const result = await getIdentifierData();

      // Assert
      expect(result).toEqual({
        prefixes: ['XYZ'],
        sourcesByPrefix: new Map([['XYZ', 'source-2']]),
        primaryIdentifierTypeUuid: 'primary-uuid',
      });
    });

    it('should handle identifier sources without UUIDs', async () => {
      // Arrange
      const mockIdentifierTypes = [
        {
          uuid: 'primary-uuid',
          name: 'Primary ID',
          identifierSources: [
            {
              // No uuid
              prefix: 'ABC',
            },
          ],
        },
      ];
      const mockSettings = [
        {
          property: PRIMARY_IDENTIFIER_TYPE_PROPERTY,
          value: 'primary-uuid',
        },
      ];

      mockedGet.mockResolvedValueOnce(mockIdentifierTypes);
      mockedGet.mockResolvedValueOnce(mockSettings);

      // Act
      const result = await getIdentifierData();

      // Assert
      expect(result).toEqual({
        prefixes: ['ABC'],
        sourcesByPrefix: new Map(),
        primaryIdentifierTypeUuid: 'primary-uuid',
      });
    });
  });

  describe('createPatient', () => {
    it('should create a patient with valid data', async () => {
      // Arrange
      const mockPatientData = {
        patient: {
          person: {
            names: [
              {
                givenName: 'John',
                familyName: 'Doe',
              },
            ],
            gender: 'M',
            birthdate: '1990-01-01',
            addresses: [
              {
                address1: '123 Main St',
                cityVillage: 'Boston',
                stateProvince: 'MA',
                postalCode: '02115',
              },
            ],
            attributes: [],
          },
          identifiers: [
            {
              identifier: 'ABC123',
              identifierType: 'uuid-123',
              preferred: true,
            },
          ],
        },
      };
      const mockResponse = {
        patient: {
          uuid: 'new-patient-uuid',
          person: mockPatientData.patient.person,
          identifiers: mockPatientData.patient.identifiers,
        },
      };
      mockedPost.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await createPatient(mockPatientData);

      // Assert
      expect(mockedPost).toHaveBeenCalledWith(
        CREATE_PATIENT_URL,
        mockPatientData,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should propagate API errors', async () => {
      // Arrange
      const mockPatientData = {
        patient: {
          person: {
            names: [],
            gender: 'M',
            birthdate: '1990-01-01',
          },
          identifiers: [],
        },
      };
      const mockError = new Error('Invalid patient data');
      mockedPost.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(createPatient(mockPatientData)).rejects.toThrow(
        'Invalid patient data',
      );
    });
  });

  describe('getGenders', () => {
    it('should return object of gender codes to display names', async () => {
      // Arrange
      const mockGenders = {
        M: 'Male',
        F: 'Female',
        O: 'Other',
      };
      mockedGet.mockResolvedValueOnce(mockGenders);

      // Act
      const result = await getGenders();

      // Assert
      expect(mockedGet).toHaveBeenCalledWith(APP_PROPERTY_URL('mrs.genders'));
      expect(result).toEqual({ M: 'Male', F: 'Female', O: 'Other' });
    });

    it('should return empty object when no genders configured', async () => {
      // Arrange
      mockedGet.mockResolvedValueOnce({});

      // Act
      const result = await getGenders();

      // Assert
      expect(result).toEqual({});
    });

    it('should propagate API errors', async () => {
      // Arrange
      const mockError = new Error('Failed to fetch genders');
      mockedGet.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(getGenders()).rejects.toThrow('Failed to fetch genders');
    });
  });

  describe('getAddressHierarchyEntries', () => {
    it('should fetch address hierarchy entries', async () => {
      // Arrange
      const mockEntries = [
        {
          name: 'Boston',
          parent: 'Massachusetts',
          uuid: 'boston-uuid',
        },
        {
          name: 'Cambridge',
          parent: 'Massachusetts',
          uuid: 'cambridge-uuid',
        },
      ];
      mockedGet.mockResolvedValueOnce(mockEntries);

      // Act
      const result = await getAddressHierarchyEntries('cityVillage', 'Bos', 20);

      // Assert
      expect(mockedGet).toHaveBeenCalledWith(
        ADDRESS_HIERARCHY_URL('cityVillage', 'Bos', 20),
      );
      expect(result).toEqual(mockEntries);
    });

    it('should return empty array when search string is too short', async () => {
      // Act
      const result = await getAddressHierarchyEntries('cityVillage', 'B', 20);

      // Assert
      expect(mockedGet).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array when search string is empty', async () => {
      // Act
      const result = await getAddressHierarchyEntries('cityVillage', '', 20);

      // Assert
      expect(mockedGet).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should use default limit when not provided', async () => {
      // Arrange
      const mockEntries: any[] = [];
      mockedGet.mockResolvedValueOnce(mockEntries);

      // Act
      await getAddressHierarchyEntries('cityVillage', 'Boston');

      // Assert
      expect(mockedGet).toHaveBeenCalledWith(
        ADDRESS_HIERARCHY_URL('cityVillage', 'Boston', 20),
      );
    });

    it('should throw error with message when API call fails', async () => {
      // Arrange
      const mockError = new Error('Network error');
      mockedGet.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(
        getAddressHierarchyEntries('cityVillage', 'Boston', 20),
      ).rejects.toThrow(
        'Failed to fetch address hierarchy for field "cityVillage": Network error',
      );
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      mockedGet.mockRejectedValueOnce('String error');

      // Act & Assert
      await expect(
        getAddressHierarchyEntries('cityVillage', 'Boston', 20),
      ).rejects.toThrow(
        'Failed to fetch address hierarchy for field "cityVillage": Unknown error',
      );
    });

    it('should handle minimum search length boundary', async () => {
      // Arrange
      const mockEntries: any[] = [];
      mockedGet.mockResolvedValueOnce(mockEntries);

      // Act - exactly at minimum length (2 characters)
      const result = await getAddressHierarchyEntries('cityVillage', 'Bo', 20);

      // Assert
      expect(mockedGet).toHaveBeenCalledWith(
        ADDRESS_HIERARCHY_URL('cityVillage', 'Bo', 20),
      );
      expect(result).toEqual([]);
    });
  });

  describe('getPatientImageAsDataUrl', () => {
    it('should fetch patient image correctly', async () => {
      const patientUUID = 'c22a5000-3f10-11e4-adec-0800271c1b75';
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      const mockResponse = {
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await getPatientImageAsDataUrl(patientUUID);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`patientUuid=${patientUUID}`),
      );
    });
  });

  describe('getPatientProfile', () => {
    it('should fetch patient profile correctly', async () => {
      const patientUuid = 'c22a5000-3f10-11e4-adec-0800271c1b75';
      const mockProfile = {
        patient: {
          uuid: patientUuid,
          person: {
            names: [{ givenName: 'John', familyName: 'Doe' }],
          },
        },
      };
      mockedGet.mockResolvedValueOnce(mockProfile);

      const result = await getPatientProfile(patientUuid);

      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringContaining(`/patientprofile/${patientUuid}?v=full`),
      );
      expect(result).toEqual(mockProfile);
    });
  });
});
