import {
  get,
  post,
  createEncounterBundle,
  findActiveEncounterInSession,
} from '@bahmni/services';
import { Bundle, ValueSet } from 'fhir/r4';
import { fetchStopReasons, stopMedication } from '../stopMedicationService';
import { useEncounterDetailsStore } from '../../stores/encounterDetailsStore';
import {
  postEncounterBundle,
  createEncounterBundleEntry,
} from '../encounterBundleService';
import { createEncounterResource } from '../../utils/fhir/encounterResourceCreator';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  get: jest.fn(),
  post: jest.fn(),
  createEncounterBundle: jest.fn((entries) => ({
    resourceType: 'Bundle',
    type: 'transaction',
    entry: entries,
  })),
  findActiveEncounterInSession: jest.fn(),
}));

jest.mock('../encounterBundleService', () => ({
  postEncounterBundle: jest.fn(),
  createEncounterBundleEntry: jest.fn((existing, resource) => ({ resource })),
}));

jest.mock('../../utils/fhir/encounterResourceCreator', () => ({
  createEncounterResource: jest.fn(() => ({ resourceType: 'Encounter' })),
}));

jest.mock('../../stores/encounterDetailsStore', () => ({
  useEncounterDetailsStore: {
    getState: jest.fn(() => ({
      selectedEncounterType: { uuid: 'enc-type-uuid', name: 'Consultation' },
      patientUUID: 'patient-1',
      practitioner: { uuid: 'practitioner-uuid' },
      encounterParticipants: [],
      activeVisit: { id: 'visit-uuid' },
      selectedLocation: { uuid: 'location-uuid' },
    })),
  },
}));

const mockGet = get as jest.MockedFunction<typeof get>;
const mockPost = post as jest.MockedFunction<typeof post>;
const mockPostEncounterBundle = postEncounterBundle as jest.MockedFunction<
  typeof postEncounterBundle
>;
const mockFindActiveEncounterInSession =
  findActiveEncounterInSession as jest.MockedFunction<
    typeof findActiveEncounterInSession
  >;

describe('stopMedicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindActiveEncounterInSession.mockResolvedValue(null);
    mockPostEncounterBundle.mockResolvedValue({
      entry: [{ resource: { id: 'enc-uuid-1' } }],
    } as any);
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
      const searchBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      };
      mockGet.mockResolvedValueOnce(searchBundle);

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
  });

  describe('stopMedication', () => {
    const baseParams = {
      medicationRequestId: 'med-req-1',
      patientUuid: 'patient-1',
      reason: { uuid: 'reason-uuid-1', display: 'Refused To Take' },
      effectiveDate: new Date('2025-06-10'),
    };

    it('should create encounter then POST MedicationRequest with status=stopped', async () => {
      mockPost.mockResolvedValueOnce({});

      await stopMedication(baseParams);

      expect(mockPostEncounterBundle).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/MedicationRequest'),
        expect.objectContaining({
          status: 'stopped',
          priorPrescription: { reference: 'MedicationRequest/med-req-1' },
          encounter: { reference: 'Encounter/enc-uuid-1' },
          statusReason: expect.objectContaining({ text: 'Refused To Take' }),
        }),
      );
    });

    it('should reuse existing session encounter when available', async () => {
      mockFindActiveEncounterInSession.mockResolvedValue({
        id: 'existing-enc-uuid',
      } as any);
      mockPost.mockResolvedValueOnce({});

      await stopMedication(baseParams);

      expect(mockPostEncounterBundle).not.toHaveBeenCalled();
      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          encounter: { reference: 'Encounter/existing-enc-uuid' },
        }),
      );
    });

    it('should include cancellation note with note-category extension when note provided', async () => {
      mockPost.mockResolvedValueOnce({});

      await stopMedication({ ...baseParams, note: 'Patient refused' });

      const body = mockPost.mock.calls[0][1] as any;
      expect(body.note[0].text).toBe('Patient refused');
      expect(body.note[0].extension[0].valueCode).toBe('cancellation-note');
    });

    it('should omit note field when note is not provided', async () => {
      mockPost.mockResolvedValueOnce({});

      await stopMedication(baseParams);

      expect((mockPost.mock.calls[0][1] as any).note).toBeUndefined();
    });

    it('should include dateStopped extension with formatted date', async () => {
      mockPost.mockResolvedValueOnce({});
      const localMidnight = new Date(2025, 5, 10);

      await stopMedication({ ...baseParams, effectiveDate: localMidnight });

      const body = mockPost.mock.calls[0][1] as any;
      expect(body.extension[0].valueDateTime).toBe('2025-06-10');
    });

    it('should use practitioner as encounter participant when encounterParticipants empty', async () => {
      mockPost.mockResolvedValueOnce({});

      await stopMedication(baseParams);

      expect(createEncounterResource).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'patient-1',
        ['practitioner-uuid'],
        expect.any(String),
        [],
        expect.any(String),
        null,
      );
    });

    it('should throw when missing session context', async () => {
      (useEncounterDetailsStore.getState as jest.Mock).mockReturnValueOnce({
        selectedEncounterType: null,
        patientUUID: null,
        activeVisit: null,
        selectedLocation: null,
      });

      await expect(stopMedication(baseParams)).rejects.toThrow(
        'Missing session context',
      );
    });
  });
});
