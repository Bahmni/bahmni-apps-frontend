import type { Bundle, Encounter, Observation } from 'fhir/r4';
import * as api from '../../api';
import {
  mockObservationBundle,
  mockEmptyObservationBundle,
  mockObservation,
  mockObservationWithEncounterBundle,
  mockFormsEncounter,
  mockObservationWithFormPath,
  mockObservationsForVitals,
  mockEncounterWithProvider,
  mockEncounterWithoutProvider,
  mockEncounterWithoutPeriodStart,
} from '../__mocks__/observationMocks';
import {
  FHIR_OBSERVATION_URL,
  FHIR_OBSERVATIONS_BY_ENCOUNTER_URL,
  FHIR_OBSERVATION_LASTN_URL,
} from '../constants';
import {
  getPatientObservationsBundle,
  getPatientObservations,
  getPatientObservationsWithEncounterBundle,
  getPatientLatestObservations,
  getObservationsBundleByEncounterUuid,
  groupObservationsByEncounter,
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

    it('should call API with optional conceptCodes', async () => {
      const patientUuid = 'patient-uuid-123';
      const mockBundle = { resourceType: 'Bundle', entry: [] };
      (api.get as jest.Mock).mockResolvedValue(mockBundle);

      await getPatientObservationsBundle(patientUuid);

      expect(api.get).toHaveBeenCalledWith(
        FHIR_OBSERVATION_URL(patientUuid, undefined),
      );
    });

    it('should call API with serviceRequestId', async () => {
      const patientUuid = 'patient-uuid-123';
      const conceptCodes = ['concept-1'];
      const serviceRequestId = 'service-request-123';
      const mockBundle = { resourceType: 'Bundle', entry: [] };
      (api.get as jest.Mock).mockResolvedValue(mockBundle);

      await getPatientObservationsBundle(
        patientUuid,
        conceptCodes,
        serviceRequestId,
      );

      expect(api.get).toHaveBeenCalledWith(
        FHIR_OBSERVATION_URL(patientUuid, conceptCodes, serviceRequestId),
      );
    });

    it('should call API with serviceRequestId and no conceptCodes', async () => {
      const patientUuid = 'patient-uuid-123';
      const serviceRequestId = 'service-request-123';
      const mockBundle = { resourceType: 'Bundle', entry: [] };
      (api.get as jest.Mock).mockResolvedValue(mockBundle);

      const result = await getPatientObservationsBundle(
        patientUuid,
        undefined,
        serviceRequestId,
      );

      expect(api.get).toHaveBeenCalledWith(
        FHIR_OBSERVATION_URL(patientUuid, undefined, serviceRequestId),
      );
      expect(result).toEqual(mockBundle);
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

      const result = await getPatientObservationsWithEncounterBundle(
        patientUuid,
        conceptCodes,
      );

      expect(api.get).toHaveBeenCalledWith(
        FHIR_OBSERVATION_URL(patientUuid, conceptCodes, undefined, true),
      );
      expect(result).toEqual(mockObservationWithEncounterBundle);
    });

    it('should call API with empty conceptCodes', async () => {
      const patientUuid = 'patient-uuid-123';
      (api.get as jest.Mock).mockResolvedValue(
        mockObservationWithEncounterBundle,
      );

      const result = await getPatientObservationsWithEncounterBundle(
        patientUuid,
        [],
      );

      expect(api.get).toHaveBeenCalledWith(
        FHIR_OBSERVATION_URL(patientUuid, [], undefined, true),
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

  describe('getObservationsBundleByEncounterUuid', () => {
    const encounterUUID = 'e8c5eeb5-86d9-44d4-b37a-9de74a122a6e';

    it('should fetch forms encounter from the FHIR API endpoint', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce(mockFormsEncounter);

      const result = await getObservationsBundleByEncounterUuid(encounterUUID);

      expect(api.get).toHaveBeenCalledWith(
        FHIR_OBSERVATIONS_BY_ENCOUNTER_URL(encounterUUID),
      );
      expect(result.resourceType).toBe('Bundle');
      expect(result.entry).toBeDefined();
    });

    it('should propagate errors when the FHIR API call fails', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(
        new Error('Network failure'),
      );

      await expect(
        getObservationsBundleByEncounterUuid(encounterUUID),
      ).rejects.toThrow('Network failure');
    });

    it('should call API with based-on query param when basedOn is provided', async () => {
      const basedOn = 'service-request-123';
      (api.get as jest.Mock).mockResolvedValueOnce(mockFormsEncounter);

      await getObservationsBundleByEncounterUuid(encounterUUID, basedOn);

      expect(api.get).toHaveBeenCalledWith(
        FHIR_OBSERVATIONS_BY_ENCOUNTER_URL(encounterUUID, basedOn),
      );
    });
  });

  describe('groupObservationsByEncounter', () => {
    it('should group observations by encounter', () => {
      const observations = mockObservationsForVitals;
      const bundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockEncounterWithProvider,
          },
        ],
      };

      const result = groupObservationsByEncounter(observations, bundle);

      expect(result).toHaveLength(1);
      expect(result[0].encounterUuid).toBe('encounter-1');
      expect(result[0].observations).toHaveLength(2);
      expect(result[0].providerName).toBe('Super Man');
    });

    it('should return empty array when bundle has no entries', () => {
      const observations = mockObservationsForVitals;
      const emptyBundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      };

      const result = groupObservationsByEncounter(observations, emptyBundle);

      expect(result).toEqual([]);
    });

    it('should return empty array when bundle has no encounters', () => {
      const observations = mockObservationsForVitals;
      const bundleWithoutEncounters: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'some-obs',
              status: 'final',
              code: { text: 'test' },
            } as Observation,
          },
        ],
      };

      const result = groupObservationsByEncounter(
        observations,
        bundleWithoutEncounters as Bundle<Encounter>,
      );

      expect(result).toEqual([]);
    });

    it('should default to 0 when period start is missing', () => {
      const observations: Observation[] = [
        {
          ...mockObservationWithFormPath,
          encounter: {
            reference: 'Encounter/encounter-3',
          },
        },
      ];
      const bundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockEncounterWithoutPeriodStart,
          },
        ],
      };

      const result = groupObservationsByEncounter(observations, bundle);

      expect(result).toHaveLength(1);
      expect(result[0].encounterDateTime).toBe(0);
    });

    it('should default to Unknown when provider is missing', () => {
      const observations: Observation[] = [
        {
          ...mockObservationWithFormPath,
          encounter: {
            reference: 'Encounter/encounter-2',
          },
        },
      ];
      const bundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockEncounterWithoutProvider,
          },
        ],
      };

      const result = groupObservationsByEncounter(observations, bundle);

      expect(result).toHaveLength(1);
      expect(result[0].providerName).toBe('Unknown');
    });

    it('should sort groups by encounterDateTime descending', () => {
      const observations: Observation[] = [
        {
          ...mockObservationWithFormPath,
          id: 'obs-old',
          encounter: {
            reference: 'Encounter/encounter-old',
          },
        },
        {
          ...mockObservationWithFormPath,
          id: 'obs-new',
          encounter: {
            reference: 'Encounter/encounter-new',
          },
        },
      ];

      const oldEncounter: Encounter = {
        ...mockEncounterWithProvider,
        id: 'encounter-old',
        period: {
          start: '2026-07-19T09:00:00+00:00',
        },
      };

      const newEncounter: Encounter = {
        ...mockEncounterWithProvider,
        id: 'encounter-new',
        period: {
          start: '2026-07-20T09:00:00+00:00',
        },
      };

      const bundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ resource: oldEncounter }, { resource: newEncounter }],
      };

      const result = groupObservationsByEncounter(observations, bundle);

      expect(result).toHaveLength(2);
      expect(result[0].encounterUuid).toBe('encounter-new');
      expect(result[1].encounterUuid).toBe('encounter-old');
    });

    it('should skip observations without encounter reference', () => {
      const observations: Observation[] = [
        mockObservationWithFormPath,
        {
          ...mockObservationWithFormPath,
          id: 'obs-no-encounter',
          encounter: undefined,
        },
      ];
      const bundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockEncounterWithProvider,
          },
        ],
      };

      const result = groupObservationsByEncounter(observations, bundle);

      expect(result).toHaveLength(1);
      expect(result[0].observations).toHaveLength(1);
      expect(result[0].observations[0].id).toBe('obs-1');
    });
  });

  describe('getPatientLatestObservations', () => {
    it('should call API with correct patient and concept UUIDs', async () => {
      const patientUuid = 'patient-uuid-123';
      const conceptCodes = ['concept-1', 'concept-2'];
      const mockBundle = { resourceType: 'Bundle', entry: [] };
      (api.get as jest.Mock).mockResolvedValue(mockBundle);

      await getPatientLatestObservations(patientUuid, conceptCodes);

      expect(api.get).toHaveBeenCalledWith(
        FHIR_OBSERVATION_LASTN_URL(patientUuid, conceptCodes),
      );
    });

    it('should include _include=Observation:encounter when includeEncounter is true', async () => {
      const patientUuid = 'patient-uuid-123';
      const conceptCodes = ['concept-1'];
      const mockBundle = { resourceType: 'Bundle', entry: [] };
      (api.get as jest.Mock).mockResolvedValue(mockBundle);

      await getPatientLatestObservations(
        patientUuid,
        conceptCodes,
        undefined,
        true,
      );

      const calledUrl = (api.get as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('_include=Observation:has-member');
      expect(calledUrl).toContain('_include=Observation:encounter');
    });

    it('should not include _include=Observation:encounter when includeEncounter is false', async () => {
      const patientUuid = 'patient-uuid-123';
      const conceptCodes = ['concept-1'];
      const mockBundle = { resourceType: 'Bundle', entry: [] };
      (api.get as jest.Mock).mockResolvedValue(mockBundle);

      await getPatientLatestObservations(
        patientUuid,
        conceptCodes,
        undefined,
        false,
      );

      const calledUrl = (api.get as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('_include=Observation:has-member');
      expect(calledUrl).not.toContain('_include=Observation:encounter');
    });

    it('should call API with encounter UUIDs when provided', async () => {
      const patientUuid = 'patient-uuid-123';
      const conceptCodes = ['concept-1', 'concept-2'];
      const encounterUuids = ['encounter-1', 'encounter-2'];
      const mockBundle = { resourceType: 'Bundle', entry: [] };
      (api.get as jest.Mock).mockResolvedValue(mockBundle);

      await getPatientLatestObservations(
        patientUuid,
        conceptCodes,
        encounterUuids,
        true,
      );

      expect(api.get).toHaveBeenCalledWith(
        FHIR_OBSERVATION_LASTN_URL(
          patientUuid,
          conceptCodes,
          encounterUuids,
          true,
        ),
      );
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API error');
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(
        getPatientLatestObservations('patient-123', ['concept-1']),
      ).rejects.toThrow(mockError);
    });
  });

  describe('getPatientObservationsWithEncounterBundle with encounterUuids', () => {
    it('should call API with encounter UUIDs when provided', async () => {
      const patientUuid = 'patient-uuid-123';
      const conceptCodes = ['concept-1', 'concept-2'];
      const encounterUuids = ['encounter-1', 'encounter-2'];
      (api.get as jest.Mock).mockResolvedValue(
        mockObservationWithEncounterBundle,
      );

      await getPatientObservationsWithEncounterBundle(
        patientUuid,
        conceptCodes,
        encounterUuids,
      );

      expect(api.get).toHaveBeenCalledWith(
        FHIR_OBSERVATION_URL(
          patientUuid,
          conceptCodes,
          undefined,
          true,
          encounterUuids,
        ),
      );
    });
  });
});
