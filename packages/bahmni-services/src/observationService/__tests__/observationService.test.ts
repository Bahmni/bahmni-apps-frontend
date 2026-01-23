import * as api from '../../api';
import {
  mockObservationBundle,
  mockEmptyObservationBundle,
  mockObservation,
  mockObservationWithEncounterBundle,
} from '../__mocks__/observationMocks';
import {
  FHIR_OBSERVATION_URL,
  FHIR_OBSERVATION_WITH_ENCOUNTER_URL,
} from '../constants';
import {
  getPatientObservationsBundle,
  getPatientObservations,
  getPatientObservationsWithEncounterBundle,
} from '../observationService';

jest.mock('../../api');

describe('observationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatientObservationsBundle', () => {
    it('should call API with correct patient and concept UUIDs', async () => {
      const patientUuid = 'patient-uuid-123';
      const conceptCodes = ['concept-1', 'concept-2'];
      const mockBundle = { resourceType: 'Bundle', entry: [] };
      (api.get as jest.Mock).mockResolvedValue(mockBundle);

      await getPatientObservationsBundle(patientUuid, conceptCodes);

      expect(api.get).toHaveBeenCalledWith(
        FHIR_OBSERVATION_URL(patientUuid, conceptCodes),
      );
    });

    it('should return observation bundle', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockObservationBundle);

      const result = await getPatientObservationsBundle('patient-123', [
        'concept-1',
      ]);

      expect(result).toEqual(mockObservationBundle);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API error');
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(
        getPatientObservationsBundle('patient-123', ['concept-1']),
      ).rejects.toThrow(mockError);
    });
  });

  describe('getPatientObservations', () => {
    it('should return observations from bundle', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockObservationBundle);

      const result = await getPatientObservations('patient-123', ['concept-1']);

      expect(result).toEqual([mockObservation]);
    });

    it('should handle empty bundle', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockEmptyObservationBundle);

      const result = await getPatientObservations('patient-123', ['concept-1']);

      expect(result).toEqual([]);
    });

    it('should filter out non-Observation resources', async () => {
      const mixedBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockObservation,
          },
          {
            resource: {
              resourceType: 'Encounter',
              id: 'enc-1',
            },
          },
        ],
      };
      (api.get as jest.Mock).mockResolvedValue(mixedBundle);

      const result = await getPatientObservations('patient-123', ['concept-1']);

      expect(result).toEqual([mockObservation]);
    });

    it('should handle bundle with no entry field', async () => {
      const bundleWithoutEntry = {
        resourceType: 'Bundle',
        type: 'searchset',
      };
      (api.get as jest.Mock).mockResolvedValue(bundleWithoutEntry);

      const result = await getPatientObservations('patient-123', ['concept-1']);

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API error');
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(
        getPatientObservations('patient-123', ['concept-1']),
      ).rejects.toThrow(mockError);
    });
  });

  describe('getPatientObservationsWithEncounterBundle', () => {
    it('should call API with correct patient and concept UUIDs', async () => {
      const patientUuid = 'patient-uuid-123';
      const conceptCodes = ['concept-1', 'concept-2'];
      (api.get as jest.Mock).mockResolvedValue(
        mockObservationWithEncounterBundle,
      );

      await getPatientObservationsWithEncounterBundle(
        patientUuid,
        conceptCodes,
      );

      expect(api.get).toHaveBeenCalledWith(
        FHIR_OBSERVATION_WITH_ENCOUNTER_URL(patientUuid, conceptCodes),
      );
    });

    it('should return observation bundle with encounters', async () => {
      (api.get as jest.Mock).mockResolvedValue(
        mockObservationWithEncounterBundle,
      );

      const result = await getPatientObservationsWithEncounterBundle(
        'patient-123',
        ['concept-1'],
      );

      expect(result).toEqual(mockObservationWithEncounterBundle);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API error');
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(
        getPatientObservationsWithEncounterBundle('patient-123', ['concept-1']),
      ).rejects.toThrow(mockError);
    });
  });
});
