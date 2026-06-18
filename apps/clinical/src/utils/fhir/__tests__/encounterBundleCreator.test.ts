import { BundleEntry, FhirResource } from 'fhir/r4';
import {
  createEncounterBundle,
  createBundleEntry,
} from '../encounterBundleCreator';

// Mock crypto.randomUUID
const mockUUID = '1d87ab20-8b86-4b41-a30d-984b2208d945';
global.crypto.randomUUID = jest.fn().mockReturnValue(mockUUID);

describe('encounterBundleCreator utility functions', () => {
  describe('createEncounterBundle', () => {
    beforeAll(() => {
      const mockDate = new Date('2023-01-01T12:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    });
    afterAll(() => {
      jest.resetAllMocks();
    });

    it('should create a EncounterBundle with the provided entries', () => {
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

      const result = createEncounterBundle(mockEntries);

      expect(result).toEqual({
        resourceType: 'EncounterBundle',
        type: 'transaction',
        id: mockUUID,
        timestamp: '2023-01-01T12:00:00.000Z',
        entry: mockEntries,
      });
    });

    it('should create a EncounterBundle with empty entries when provided an empty array', () => {
      const mockEntries: Array<BundleEntry<FhirResource>> = [];

      const result = createEncounterBundle(mockEntries);

      expect(result).toEqual({
        resourceType: 'EncounterBundle',
        type: 'transaction',
        id: mockUUID,
        timestamp: '2023-01-01T12:00:00.000Z',
        entry: [],
      });
    });
  });

  describe('createBundleEntry', () => {
    it('should create a BundleEntry with the provided fullURL, resource, and request method', () => {
      const fullURL = 'urn:uuid:456';
      const resource: FhirResource = {
        resourceType: 'Patient',
        id: '123',
      };
      const requestMethod = 'POST';

      const result = createBundleEntry(fullURL, resource, requestMethod);

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
