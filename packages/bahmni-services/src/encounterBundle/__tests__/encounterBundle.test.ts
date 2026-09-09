import { BundleEntry, FhirResource } from 'fhir/r4';
import { createBundleEntry, createEncounterBundle } from '../encounterBundle';

const mockUUID = '1d87ab20-8b86-4b41-a30d-984b2208d945';

describe('encounterBundle', () => {
  describe('createEncounterBundle', () => {
    beforeAll(() => {
      global.crypto.randomUUID = jest.fn().mockReturnValue(mockUUID);
      const mockDate = new Date('2023-01-01T12:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    });
    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('wraps the provided entries in a transaction EncounterBundle', () => {
      const entries: Array<BundleEntry<FhirResource>> = [
        {
          fullUrl: 'urn:uuid:123',
          resource: { resourceType: 'Patient' },
          request: { method: 'POST', url: 'Patient' },
        },
      ];

      expect(createEncounterBundle(entries)).toEqual({
        resourceType: 'EncounterBundle',
        type: 'transaction',
        id: mockUUID,
        timestamp: '2023-01-01T12:00:00.000Z',
        entry: entries,
      });
    });

    it('supports an empty entry list', () => {
      expect(createEncounterBundle([])).toEqual({
        resourceType: 'EncounterBundle',
        type: 'transaction',
        id: mockUUID,
        timestamp: '2023-01-01T12:00:00.000Z',
        entry: [],
      });
    });
  });

  describe('createBundleEntry', () => {
    it('defaults the request url to the resource type', () => {
      const resource: FhirResource = { resourceType: 'Patient', id: '123' };

      expect(createBundleEntry('urn:uuid:456', resource, 'POST')).toEqual({
        fullUrl: 'urn:uuid:456',
        resource,
        request: { method: 'POST', url: 'Patient' },
      });
    });

    it('uses an explicit resource url when provided', () => {
      const resource: FhirResource = { resourceType: 'Encounter', id: 'enc-1' };

      expect(
        createBundleEntry(
          'Encounter/enc-1',
          resource,
          'PUT',
          'Encounter/enc-1',
        ),
      ).toEqual({
        fullUrl: 'Encounter/enc-1',
        resource,
        request: { method: 'PUT', url: 'Encounter/enc-1' },
      });
    });
  });
});
