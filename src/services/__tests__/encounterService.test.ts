import { get } from '@services/api';
import {
  getPatientEncountersBundle,
  getEncounters,
  getCurrentEncounter,
} from '@services/encounterService';
import { PATIENT_ENCOUNTER_RESOURCE_URL } from '@constants/app';
import {
  mockEncounterBundle,
  mockCurrentEncounter,
} from '@__mocks__/encounterMocks';

jest.mock('@services/api');
const mockedGet = get as jest.MockedFunction<typeof get>;

describe('encounterService', () => {
  const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatientEncountersBundle', () => {
    it('should fetch encounter bundle from the correct endpoint', async () => {
      mockedGet.mockResolvedValueOnce(mockEncounterBundle);

      await getPatientEncountersBundle(patientUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        PATIENT_ENCOUNTER_RESOURCE_URL(patientUUID),
      );
    });

    it('should return the encounter bundle', async () => {
      mockedGet.mockResolvedValueOnce(mockEncounterBundle);

      const result = await getPatientEncountersBundle(patientUUID);

      expect(result).toEqual(mockEncounterBundle);
    });
  });

  describe('getEncounters', () => {
    it('should extract encounters from the bundle', async () => {
      mockedGet.mockResolvedValueOnce(mockEncounterBundle);

      const encounters = await getEncounters(patientUUID);

      expect(encounters).toEqual(
        mockEncounterBundle.entry.map((entry) => entry.resource),
      );
    });

    it('should return empty array if no encounters are found', async () => {
      mockedGet.mockResolvedValueOnce({ entry: undefined });

      const encounters = await getEncounters(patientUUID);

      expect(encounters).toEqual([]);
    });
  });

  describe('getCurrentEncounter', () => {
    it('should return the encounter without an end date', async () => {
      mockedGet.mockResolvedValueOnce(mockEncounterBundle);

      const currentEncounter = await getCurrentEncounter(patientUUID);

      expect(currentEncounter).toEqual(mockCurrentEncounter);
    });

    it('should return null if no current encounter is found', async () => {
      const bundleWithoutCurrentEncounter = {
        ...mockEncounterBundle,
        entry: mockEncounterBundle.entry.map((entry) => ({
          ...entry,
          resource: {
            ...entry.resource,
            period: {
              ...entry.resource.period,
              end: entry.resource.period.end || '2025-04-09T10:14:51+00:00',
            },
          },
        })),
      };

      mockedGet.mockResolvedValueOnce(bundleWithoutCurrentEncounter);

      const currentEncounter = await getCurrentEncounter(patientUUID);

      expect(currentEncounter).toBeNull();
    });
  });
});
