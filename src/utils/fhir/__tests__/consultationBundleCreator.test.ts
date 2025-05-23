import {
  createConsultationBundle,
  createBundleEntry,
} from '../consultationBundleCreator';
import { BundleEntry, FhirResource } from 'fhir/r4';

// Mock crypto.randomUUID
const mockUUID = '1d87ab20-8b86-4b41-a30d-984b2208d945';
global.crypto.randomUUID = jest.fn().mockReturnValue(mockUUID);

describe('consultationBundleCreator utility functions', () => {
  describe('createConsultationBundle', () => {
    beforeAll(() => {
      const mockDate = new Date('2023-01-01T12:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    });
    afterAll(() => {
      jest.resetAllMocks();
    });

    it('should create a ConsultationBundle with the provided entries', () => {
      // Arrange
      const mockEntries: Array<BundleEntry<FhirResource>> = [
        {
          fullUrl: 'urn:uuid:123',
          resource: {
            resourceType: 'Patient',
          },
          request: {
            method: 'POST',
            url: 'Patient',
          },
        },
      ];

      // Act
      const result = createConsultationBundle(mockEntries);

      // Assert
      expect(result).toEqual({
        resourceType: 'ConsultationBundle',
        type: 'transaction',
        id: mockUUID,
        timestamp: '2023-01-01T12:00:00.000Z',
        entry: mockEntries,
      });
    });

    it('should create a ConsultationBundle with empty entries when provided an empty array', () => {
      // Arrange
      const mockEntries: Array<BundleEntry<FhirResource>> = [];

      // Act
      const result = createConsultationBundle(mockEntries);

      // Assert
      expect(result).toEqual({
        resourceType: 'ConsultationBundle',
        type: 'transaction',
        id: mockUUID,
        timestamp: '2023-01-01T12:00:00.000Z',
        entry: [],
      });
    });
  });

  describe('createBundleEntry', () => {
    it('should create a BundleEntry with the provided fullURL, resource, and request method', () => {
      // Arrange
      const fullURL = 'urn:uuid:456';
      const resource: FhirResource = {
        resourceType: 'Patient',
        id: '123',
      };
      const requestMethod = 'POST';

      // Act
      const result = createBundleEntry(fullURL, resource, requestMethod);

      // Assert
      expect(result).toEqual({
        fullUrl: fullURL,
        resource: resource,
        request: {
          method: requestMethod,
          url: resource.resourceType,
        },
      });
    });
  });
});
