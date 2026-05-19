import { resolveComboBoxItems } from '@bahmni/services';
import { MedicationRequest, Reference } from 'fhir/r4';
import {
  createMedicationRequestEntries,
  getMedicationRequestComboBoxItems,
} from '../utils';
import { mockMedicationEntry } from './__mocks__/MedicationRequestFormMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  resolveComboBoxItems: jest.fn(),
}));

jest.mock('../../../../services/medicationService', () => ({
  getMedicationDisplay: jest.fn((m) => m?.code?.text ?? 'Unknown'),
}));

const mockUUID = '1d87ab20-8b86-4b41-a30d-984b2208d945';
globalThis.crypto.randomUUID = jest.fn().mockReturnValue(mockUUID);

const mockEncounterSubject: Reference = { reference: 'Patient/123' };
const mockEncounterReference = 'urn:uuid:12345';
const mockPractitionerUUID = 'd7a669e7-5e07-11ef-8f7c-0242ac120002';

describe('getMedicationRequestComboBoxItems', () => {
  const messages = { loading: 'Loading', error: 'Error', empty: 'Empty' };
  const mockResolveComboBoxItems = jest.mocked(resolveComboBoxItems);

  beforeEach(() => {
    mockResolveComboBoxItems.mockReturnValue([]);
  });

  it('passes empty array to resolveComboBoxItems when medicationResults is undefined', () => {
    getMedicationRequestComboBoxItems(
      'test',
      undefined,
      false,
      false,
      messages,
    );
    expect(mockResolveComboBoxItems).toHaveBeenCalledWith(
      false,
      false,
      [],
      expect.any(Function),
      messages,
    );
  });
});

describe('createMedicationRequestEntries', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('Bundle Entry Creation', () => {
    it('should create bundle entries with correct structure', () => {
      const result = createMedicationRequestEntries({
        selectedMedicationRequests: [mockMedicationEntry],
        encounterSubject: mockEncounterSubject,
        encounterReference: mockEncounterReference,
        practitionerUUID: mockPractitionerUUID,
      });

      expect(result).toHaveLength(1);
      expect(result[0].fullUrl).toBe(`urn:uuid:${mockUUID}`);
      expect(result[0].resource?.resourceType).toBe('MedicationRequest');
      expect(result[0].request).toEqual({
        method: 'POST',
        url: 'MedicationRequest',
      });
    });

    it('should create multiple bundle entries for multiple medications', () => {
      const medications = [
        mockMedicationEntry,
        { ...mockMedicationEntry, id: 'med-456' },
        { ...mockMedicationEntry, id: 'med-789' },
      ];

      const result = createMedicationRequestEntries({
        selectedMedicationRequests: medications,
        encounterSubject: mockEncounterSubject,
        encounterReference: mockEncounterReference,
        practitionerUUID: mockPractitionerUUID,
      });

      expect(result).toHaveLength(3);
      result.forEach((entry) => {
        expect(entry.resource?.resourceType).toBe('MedicationRequest');
        expect(entry.request?.method).toBe('POST');
      });
    });

    it('should return empty array for empty medications list', () => {
      const result = createMedicationRequestEntries({
        selectedMedicationRequests: [],
        encounterSubject: mockEncounterSubject,
        encounterReference: mockEncounterReference,
        practitionerUUID: mockPractitionerUUID,
      });

      expect(result).toEqual([]);
    });
  });

  describe('Reference Creation', () => {
    it('should create proper references for encounter and practitioner', () => {
      const result = createMedicationRequestEntries({
        selectedMedicationRequests: [mockMedicationEntry],
        encounterSubject: mockEncounterSubject,
        encounterReference: mockEncounterReference,
        practitionerUUID: mockPractitionerUUID,
      });

      const medicationRequest = result[0].resource as MedicationRequest;
      expect(medicationRequest.subject).toEqual(mockEncounterSubject);
      expect(medicationRequest.encounter?.reference).toBe(
        mockEncounterReference,
      );
      expect(medicationRequest.requester?.reference).toBe(
        `Practitioner/${mockPractitionerUUID}`,
      );
    });
  });

  describe('UUID Generation', () => {
    it('should generate unique UUIDs for each medication entry', () => {
      const medications = [
        mockMedicationEntry,
        { ...mockMedicationEntry, id: 'med-456' },
      ];

      let callCount = 0;
      const uuids = ['uuid-1', 'uuid-2'];
      (globalThis.crypto.randomUUID as jest.Mock).mockImplementation(
        () => uuids[callCount++],
      );

      const result = createMedicationRequestEntries({
        selectedMedicationRequests: medications,
        encounterSubject: mockEncounterSubject,
        encounterReference: mockEncounterReference,
        practitionerUUID: mockPractitionerUUID,
      });

      expect(result[0].fullUrl).toBe('urn:uuid:uuid-1');
      expect(result[1].fullUrl).toBe('urn:uuid:uuid-2');

      (globalThis.crypto.randomUUID as jest.Mock).mockReturnValue(mockUUID);
    });
  });
});
