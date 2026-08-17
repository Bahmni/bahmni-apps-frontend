import { get, createBundleEntry } from '@bahmni/services';
import { Bundle, ValueSet } from 'fhir/r4';
import {
  fetchStopReasons,
  createStopMedicationEntry,
} from '../stopMedicationService';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  get: jest.fn(),
  createBundleEntry: jest.fn((fullUrl, resource, method) => ({
    fullUrl,
    resource,
    request: { method, url: resource.resourceType },
  })),
}));

const mockGet = get as jest.MockedFunction<typeof get>;

const baseCtx = {
  encounterReference: 'enc-uuid-1',
  encounterSubject: { reference: 'Patient/patient-1' },
  practitionerUUID: 'practitioner-uuid',
  consultationDate: new Date('2025-06-10'),
};

describe('stopMedicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchStopReasons', () => {
    it('should return stop reasons from ValueSet expand', async () => {
      const searchBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'ValueSet',
              id: 'vs-uuid-1',
              status: 'active',
            } as ValueSet,
          },
        ],
      };
      const expandedValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'vs-uuid-1',
        status: 'active',
        expansion: {
          timestamp: '2025-01-01',
          contains: [
            { code: 'reason-1', display: 'Adverse reaction' },
            { code: 'reason-2', display: 'Patient request' },
          ],
        },
      };
      mockGet
        .mockResolvedValueOnce(searchBundle)
        .mockResolvedValueOnce(expandedValueSet);

      const result = await fetchStopReasons();

      expect(result).toEqual([
        { uuid: 'reason-1', display: 'Adverse reaction' },
        { uuid: 'reason-2', display: 'Patient request' },
      ]);
      expect(mockGet).toHaveBeenCalledWith(
        '/openmrs/ws/fhir2/R4/ValueSet?title=Stopped%20Order%20Reason',
      );
    });

    it('should use custom concept set name when provided', async () => {
      mockGet.mockResolvedValueOnce({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      });

      await fetchStopReasons('Custom Stop Reasons');

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('Custom Stop Reasons')),
      );
    });

    it('should return empty array when ValueSet not found', async () => {
      mockGet.mockResolvedValueOnce({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      });
      expect(await fetchStopReasons()).toEqual([]);
    });

    it('should return empty array on API error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));
      expect(await fetchStopReasons()).toEqual([]);
    });

    it('should return uuid="" and display="" for entries with null code and null display', async () => {
      const searchBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'ValueSet',
              id: 'vs-uuid-null',
              status: 'active',
            } as ValueSet,
          },
        ],
      };
      const expandedValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'vs-uuid-null',
        status: 'active',
        expansion: {
          timestamp: '2025-01-01',
          contains: [
            { code: undefined, display: undefined },
            { code: 'reason-3', display: 'Valid Reason' },
          ],
        },
      };
      mockGet
        .mockResolvedValueOnce(searchBundle)
        .mockResolvedValueOnce(expandedValueSet);

      const result = await fetchStopReasons();

      expect(result).toEqual([
        { uuid: '', display: '' },
        { uuid: 'reason-3', display: 'Valid Reason' },
      ]);
    });
  });

  describe('createStopMedicationEntry', () => {
    const baseParams = {
      medicationRequestId: 'med-req-1',
      patientUuid: 'patient-1',
      reason: { uuid: 'reason-uuid-1', display: 'Refused To Take' },
      effectiveDate: new Date(2025, 5, 10),
      ctx: baseCtx,
    };

    it('should build a stopped MedicationRequest bundle entry with encounter reference', () => {
      createStopMedicationEntry(baseParams);

      const resource = (createBundleEntry as jest.Mock).mock.calls[0][1];
      expect(resource.status).toBe('stopped');
      expect(resource.priorPrescription).toEqual({
        reference: 'MedicationRequest/med-req-1',
      });
      expect(resource.encounter).toEqual({ reference: 'enc-uuid-1' });
      expect(resource.statusReason).toEqual({
        coding: [{ code: 'reason-uuid-1', display: 'Refused To Take' }],
        text: 'Refused To Take',
      });
    });

    it('should include dateStopped extension with formatted date', () => {
      createStopMedicationEntry(baseParams);

      const resource = (createBundleEntry as jest.Mock).mock.calls[0][1];
      expect(resource.extension[0].valueDateTime).toBe('2025-06-10');
    });

    it('should include cancellation note with note-category extension when note provided', () => {
      createStopMedicationEntry({ ...baseParams, note: 'Patient refused' });

      const resource = (createBundleEntry as jest.Mock).mock.calls[0][1];
      expect(resource.note[0].text).toBe('Patient refused');
      expect(resource.note[0].extension[0].valueCode).toBe('cancellation-note');
    });

    it('should omit note field when note is not provided', () => {
      createStopMedicationEntry(baseParams);

      const resource = (createBundleEntry as jest.Mock).mock.calls[0][1];
      expect(resource.note).toBeUndefined();
    });

    it('should call createBundleEntry with POST method', () => {
      createStopMedicationEntry(baseParams);

      expect(createBundleEntry).toHaveBeenCalledWith(
        'urn:uuid:stop-med-req-1',
        expect.any(Object),
        'POST',
      );
    });
  });
});
