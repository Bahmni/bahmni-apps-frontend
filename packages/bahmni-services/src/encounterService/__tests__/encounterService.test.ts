import { get, post, put } from '../../api';
import {
  getPatientVisits,
  getVisits,
  getActiveVisit,
  getObservationsBundleByEncounterUuid,
  createFhirEncounter,
  updateFhirEncounter,
} from '../../encounterService';
import {
  mockVisitBundle,
  mockActiveVisit,
  mockFormsEncounter,
} from '../__mocks__/mocks';
import {
  PATIENT_VISITS_URL,
  FHIR_OBSERVATIONS_BY_ENCOUNTER_URL,
  FHIR_ENCOUNTER_URL,
} from '../constants';

jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;
const mockedPost = post as jest.MockedFunction<typeof post>;
const mockedPut = put as jest.MockedFunction<typeof put>;

describe('encounterService', () => {
  const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatientVisits', () => {
    it('should fetch visits from the correct endpoint', async () => {
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      await getPatientVisits(patientUUID);

      expect(mockedGet).toHaveBeenCalledWith(PATIENT_VISITS_URL(patientUUID));
    });

    it('should return the encounter bundle', async () => {
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      const result = await getPatientVisits(patientUUID);

      expect(result).toEqual(mockVisitBundle);
    });
  });

  describe('getEncounters', () => {
    it('should extract encounters from the bundle', async () => {
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      const encounters = await getVisits(patientUUID);

      expect(encounters).toEqual(
        mockVisitBundle.entry.map((entry) => entry.resource),
      );
    });

    it('should return empty array if no encounters are found', async () => {
      mockedGet.mockResolvedValueOnce({ entry: undefined });

      const encounters = await getVisits(patientUUID);

      expect(encounters).toEqual([]);
    });
  });

  describe('getActiveVisit', () => {
    it('should return the active visit', async () => {
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      const activeVisit = await getActiveVisit(patientUUID);

      expect(activeVisit).toEqual(mockActiveVisit);
    });

    it('should return null if no active visit is found', async () => {
      const bundleWithoutActiveVisit = {
        ...mockVisitBundle,
        entry: mockVisitBundle.entry.map((entry) => ({
          ...entry,
          resource: {
            ...entry.resource,
            period: {
              ...entry.resource.period,
              end: entry.resource.period.end ?? '2025-04-09T10:14:51+00:00',
            },
          },
        })),
      };

      mockedGet.mockResolvedValueOnce(bundleWithoutActiveVisit);

      const activeVisit = await getActiveVisit(patientUUID);

      expect(activeVisit).toBeNull();
    });
  });

  describe('getObservationsBundleByEncounterUuid', () => {
    const encounterUUID = 'e8c5eeb5-86d9-44d4-b37a-9de74a122a6e';

    it('should fetch forms encounter from the FHIR API endpoint', async () => {
      mockedGet.mockResolvedValueOnce(mockFormsEncounter);

      await getObservationsBundleByEncounterUuid(encounterUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        FHIR_OBSERVATIONS_BY_ENCOUNTER_URL(encounterUUID),
      );
    });

    it('should return the forms encounter data', async () => {
      mockedGet.mockResolvedValueOnce(mockFormsEncounter);

      const result = await getObservationsBundleByEncounterUuid(encounterUUID);

      expect(result.resourceType).toBe('Bundle');
      expect(result.entry).toBeDefined();
    });

    it('should propagate errors when the FHIR API call fails', async () => {
      mockedGet.mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        getObservationsBundleByEncounterUuid(encounterUUID),
      ).rejects.toThrow('Network failure');
    });
  });

  describe('createFhirEncounter', () => {
    const mockEncounterPayload = {
      resourceType: 'Encounter' as const,
      status: 'in-progress' as const,
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'ambulatory',
      },
      subject: { reference: 'Patient/patient-uuid-123' },
    };

    const mockCreatedEncounter = {
      ...mockEncounterPayload,
      id: 'encounter-uuid-456',
    };

    it('should call post with the correct URL and payload', async () => {
      mockedPost.mockResolvedValueOnce(mockCreatedEncounter);

      await createFhirEncounter(mockEncounterPayload);

      expect(mockedPost).toHaveBeenCalledWith(
        FHIR_ENCOUNTER_URL,
        mockEncounterPayload,
      );
    });

    it('should return the created encounter', async () => {
      mockedPost.mockResolvedValueOnce(mockCreatedEncounter);

      const result = await createFhirEncounter(mockEncounterPayload);

      expect(result).toEqual(mockCreatedEncounter);
    });

    it('should propagate errors when post fails', async () => {
      mockedPost.mockRejectedValueOnce(new Error('Creation failed'));

      await expect(createFhirEncounter(mockEncounterPayload)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('updateFhirEncounter', () => {
    const encounterUUID = 'encounter-uuid-456';
    const mockEncounterUpdate = {
      resourceType: 'Encounter' as const,
      id: encounterUUID,
      status: 'in-progress' as const,
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'ambulatory',
      },
      partOf: { reference: 'Encounter/visit-uuid-789' },
      subject: { reference: 'Patient/patient-uuid-123' },
    };

    it('should call put with the correct URL and payload', async () => {
      mockedPut.mockResolvedValueOnce(mockEncounterUpdate);

      await updateFhirEncounter(encounterUUID, mockEncounterUpdate);

      expect(mockedPut).toHaveBeenCalledWith(
        `${FHIR_ENCOUNTER_URL}/${encounterUUID}`,
        mockEncounterUpdate,
      );
    });

    it('should return the updated encounter', async () => {
      mockedPut.mockResolvedValueOnce(mockEncounterUpdate);

      const result = await updateFhirEncounter(
        encounterUUID,
        mockEncounterUpdate,
      );

      expect(result).toEqual(mockEncounterUpdate);
    });

    it('should propagate errors when put fails', async () => {
      mockedPut.mockRejectedValueOnce(new Error('Update failed'));

      await expect(
        updateFhirEncounter(encounterUUID, mockEncounterUpdate),
      ).rejects.toThrow('Update failed');
    });
  });
});
