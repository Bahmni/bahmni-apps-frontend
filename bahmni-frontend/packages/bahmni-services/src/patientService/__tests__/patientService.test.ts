import { Patient } from 'fhir/r4';
import { PATIENT_RESOURCE_URL } from '../constants';
import { get } from '../../api';
import {
  getPatientById,
  formatPatientName,
  formatPatientAddress,
  formatPatientContact,
  formatPatientData,
} from '../patientService';

// Mock the api module
jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;

describe('Patient Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatientById', () => {
    it('should call get with the correct patient URL', async () => {
      // Arrange
      const patientUUID = '123-456';
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
      const patientUUID = '123-456';
      const mockError = new Error('API Error');
      mockedGet.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(getPatientById(patientUUID)).rejects.toThrow('API Error');
      expect(mockedGet).toHaveBeenCalledWith(PATIENT_RESOURCE_URL(patientUUID));
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
});
