import { get, post, put } from '../../api';
import {
  getPatientVisits,
  getVisits,
  getActiveVisit,
  getActiveVisitAtLoginLocation,
  getEncounterByUuid,
  createFhirEncounter,
  updateFhirEncounter,
  getPatientEncounters,
  getEncounterTypeByName,
} from '../../encounterService';
import { mockVisitBundle, mockActiveVisit } from '../__mocks__/mocks';
import {
  PATIENT_VISITS_URL,
  PATIENT_ENCOUNTERS_URL,
  ENCOUNTER_TYPE_BY_NAME_URL,
  FHIR_ENCOUNTER_URL,
} from '../constants';

jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;
const mockedPost = post as jest.MockedFunction<typeof post>;
const mockedPut = put as jest.MockedFunction<typeof put>;

const mockGetUserLoginLocation = jest.fn();
const mockGetVisitLocationUUID = jest.fn();

jest.mock('../../userService', () => ({
  getUserLoginLocation: () => mockGetUserLoginLocation(),
}));

jest.mock('../../visitService', () => ({
  getVisitLocationUUID: (...args: any[]) => mockGetVisitLocationUUID(...args),
}));

const LOGIN_LOCATION_UUID = 'login-loc-uuid';
const VISIT_LOCATION_UUID = 'visit-loc-uuid';

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

    it('should include location query param in URL when locationUuid is provided', async () => {
      const locationUuid = 'location-123';
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      await getActiveVisit(patientUUID, locationUuid);

      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringContaining(`&location=${locationUuid}`),
      );
    });

    it('should not include location query param in URL when locationUuid is omitted', async () => {
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      await getActiveVisit(patientUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        expect.not.stringContaining('&location='),
      );
    });
  });

  describe('getEncounterByUuid', () => {
    const encounterUUID = 'abc-123-def-456';
    const mockEncounter = {
      resourceType: 'Encounter',
      id: encounterUUID,
      status: 'finished',
    };

    it('should fetch encounter from the correct FHIR endpoint', async () => {
      mockedGet.mockResolvedValueOnce(mockEncounter);

      await getEncounterByUuid(encounterUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/Encounter/${encounterUUID}`,
        undefined,
      );
    });

    it('should return encounter data', async () => {
      mockedGet.mockResolvedValueOnce(mockEncounter);

      const result = await getEncounterByUuid(encounterUUID);

      expect(result).toEqual(mockEncounter);
    });

    it('should pass options to the API call', async () => {
      const controller = new AbortController();
      const options = { signal: controller.signal };
      mockedGet.mockResolvedValueOnce(mockEncounter);

      await getEncounterByUuid(encounterUUID, options);

      expect(mockedGet).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/Encounter/${encounterUUID}`,
        options,
      );
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

  describe('getPatientEncounters', () => {
    it('should fetch and unwrap encounter resources from the bundle', async () => {
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      const result = await getPatientEncounters(patientUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        PATIENT_ENCOUNTERS_URL(patientUUID),
      );
      expect(result).toEqual(
        mockVisitBundle.entry?.map((entry) => entry.resource),
      );
    });

    it('should return an empty array when the bundle has no entries', async () => {
      mockedGet.mockResolvedValueOnce({
        resourceType: 'Bundle',
        type: 'searchset',
      });

      const result = await getPatientEncounters(patientUUID);

      expect(result).toEqual([]);
    });

    it('should walk every page until a non-full page is returned', async () => {
      const fullPage = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: Array.from({ length: 100 }, (_, i) => ({
          resource: { resourceType: 'Encounter', id: `enc-${i}` },
        })),
      };
      const lastPage = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ resource: { resourceType: 'Encounter', id: 'enc-100' } }],
      };
      mockedGet.mockResolvedValueOnce(fullPage).mockResolvedValueOnce(lastPage);

      const result = await getPatientEncounters(patientUUID);

      expect(mockedGet).toHaveBeenCalledTimes(2);
      expect(mockedGet).toHaveBeenNthCalledWith(
        1,
        PATIENT_ENCOUNTERS_URL(patientUUID, 100, 0),
      );
      expect(mockedGet).toHaveBeenNthCalledWith(
        2,
        PATIENT_ENCOUNTERS_URL(patientUUID, 100, 100),
      );
      expect(result).toHaveLength(101);
    });
  });

  describe('getEncounterTypeByName', () => {
    const name = 'Patient Document';

    it('should return the exact-name match from the results', async () => {
      mockedGet.mockResolvedValueOnce({
        results: [
          { uuid: 'other-uuid', name: 'Other' },
          { uuid: 'doc-uuid', name },
        ],
      });

      const result = await getEncounterTypeByName(name);

      expect(mockedGet).toHaveBeenCalledWith(ENCOUNTER_TYPE_BY_NAME_URL(name));
      expect(result).toEqual({ uuid: 'doc-uuid', name });
    });

    it('returns null when there is no exact-name match (fuzzy q= result)', async () => {
      mockedGet.mockResolvedValueOnce({
        results: [{ uuid: 'first-uuid', name: 'Patient Documents' }],
      });

      const result = await getEncounterTypeByName(name);

      expect(result).toBeNull();
    });

    it('should return null when there are no results', async () => {
      mockedGet.mockResolvedValueOnce({ results: [] });

      const result = await getEncounterTypeByName(name);

      expect(result).toBeNull();
    });
  });

  describe('getActiveVisitAtLoginLocation', () => {
    const PATIENT_UUID = 'patient-uuid-1';

    const makeVisit = (locationRef: string) => ({
      resourceType: 'Encounter' as const,
      id: 'visit-1',
      period: { start: '2024-01-01' },
      location: [{ location: { reference: locationRef } }],
    });

    beforeEach(() => {
      mockGetUserLoginLocation.mockReturnValue({ uuid: LOGIN_LOCATION_UUID });
      mockGetVisitLocationUUID.mockResolvedValue({ uuid: VISIT_LOCATION_UUID });
      mockedGet.mockResolvedValue({ entry: [] } as any);
    });

    it('returns null when no active visit exists at login location', async () => {
      const result = await getActiveVisitAtLoginLocation(PATIENT_UUID);

      expect(result).toBeNull();
    });

    it('returns the active visit at the login location', async () => {
      const activeVisit = makeVisit(`Location/${VISIT_LOCATION_UUID}`);
      mockedGet.mockResolvedValue({
        entry: [{ resource: activeVisit }],
      } as any);

      const result = await getActiveVisitAtLoginLocation(PATIENT_UUID);

      expect(result).toEqual(activeVisit);
    });

    it('rejects when getUserLoginLocation throws', async () => {
      mockGetUserLoginLocation.mockImplementation(() => {
        throw new Error('No login location');
      });

      await expect(getActiveVisitAtLoginLocation(PATIENT_UUID)).rejects.toThrow(
        'No login location',
      );
    });

    it('rejects when getVisitLocationUUID rejects', async () => {
      mockGetVisitLocationUUID.mockRejectedValue(new Error('Location error'));

      await expect(getActiveVisitAtLoginLocation(PATIENT_UUID)).rejects.toThrow(
        'Location error',
      );
    });

    it('rejects when the underlying fetch rejects', async () => {
      mockedGet.mockRejectedValue(new Error('Fetch error'));

      await expect(getActiveVisitAtLoginLocation(PATIENT_UUID)).rejects.toThrow(
        'Fetch error',
      );
    });

    it('passes login location UUID to getVisitLocationUUID', async () => {
      await getActiveVisitAtLoginLocation(PATIENT_UUID);

      expect(mockGetVisitLocationUUID).toHaveBeenCalledWith(
        LOGIN_LOCATION_UUID,
      );
    });

    it('passes patient UUID and visit location UUID to getActiveVisit', async () => {
      await getActiveVisitAtLoginLocation(PATIENT_UUID);

      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringContaining(PATIENT_UUID),
      );
    });
  });
});
