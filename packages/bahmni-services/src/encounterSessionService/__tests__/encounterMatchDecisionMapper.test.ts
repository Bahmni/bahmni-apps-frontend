import { Encounter } from 'fhir/r4';
import { getActiveVisit } from '../../encounterService';
import { resolveEncounterMatchDecision } from '../encounterMatchDecisionMapper';
import {
  searchEncounters,
  getEncounterSessionDuration,
} from '../encounterSessionService';

jest.mock('../../encounterService');
jest.mock('../encounterSessionService');

const mockGetActiveVisit = getActiveVisit as jest.MockedFunction<
  typeof getActiveVisit
>;
const mockSearchEncounters = searchEncounters as jest.MockedFunction<
  typeof searchEncounters
>;
const mockGetEncounterSessionDuration =
  getEncounterSessionDuration as jest.MockedFunction<
    typeof getEncounterSessionDuration
  >;

const PATIENT_UUID = 'patient-123';
const PRACTITIONER_UUID = 'practitioner-456';
const LOCATION_UUID = 'location-789';
const ENCOUNTER_TYPE_UUID = 'encounter-type-abc';
const VISIT_UUID = 'visit-111';

const createActiveVisit = (): Encounter => ({
  resourceType: 'Encounter',
  id: VISIT_UUID,
  status: 'in-progress',
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
  },
});

const createEncounter = (id: string, locationUUID?: string): Encounter => ({
  resourceType: 'Encounter',
  id,
  status: 'finished',
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
  },
  partOf: { reference: `Encounter/${VISIT_UUID}` },
  ...(locationUUID && {
    location: [{ location: { reference: `Location/${locationUUID}` } }],
  }),
});

// Setup parallel search mocks: [inSessionOwn, allTimeOwn, inSessionAny]
const mockSearches = (
  inSessionOwn: Encounter[],
  allTimeOwn: Encounter[],
  inSessionAny: Encounter[],
) => {
  mockSearchEncounters
    .mockResolvedValueOnce(inSessionOwn)
    .mockResolvedValueOnce(allTimeOwn)
    .mockResolvedValueOnce(inSessionAny);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetEncounterSessionDuration.mockResolvedValue(30);
});

describe('resolveEncounterMatchDecision', () => {
  describe('NO_ACTIVE_VISIT', () => {
    it('returns NO_ACTIVE_VISIT when patient has no active visit', async () => {
      mockGetActiveVisit.mockResolvedValue(null);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({
        matched: false,
        encounter: null,
        reasons: ['NO_ACTIVE_VISIT'],
      });
      expect(mockSearchEncounters).not.toHaveBeenCalled();
    });
  });

  describe('MATCHED', () => {
    it('returns MATCHED when in-session own encounter location UUID matches login location', async () => {
      const encounter = createEncounter('enc-1', LOCATION_UUID);
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearches([encounter], [encounter], [encounter]);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({
        matched: true,
        encounter,
        reasons: ['MATCHED'],
      });
      expect(mockSearchEncounters).toHaveBeenCalledTimes(3);
    });
  });

  describe('LOCATION_MISMATCH', () => {
    it('returns [LOCATION_MISMATCH] when in-session own encounter has different location UUID', async () => {
      const encounter = createEncounter('enc-1', 'different-location-uuid');
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearches([encounter], [encounter], [encounter]);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({
        matched: false,
        encounter,
        reasons: ['LOCATION_MISMATCH'],
      });
    });

    it('returns [LOCATION_MISMATCH] when encounter has no location entries', async () => {
      const encounter = createEncounter('enc-1');
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearches([encounter], [encounter], [encounter]);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({
        matched: false,
        encounter,
        reasons: ['LOCATION_MISMATCH'],
      });
    });

    it('does not add SESSION_EXPIRED when in-session encounter exists but location mismatches', async () => {
      const inSessionEncounter = createEncounter(
        'enc-current',
        'different-location',
      );
      const oldEncounter = createEncounter('enc-old', 'different-location');
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      // inSessionOwn has current encounter; allTimeOwn has both (current + old expired)
      mockSearches(
        [inSessionEncounter],
        [inSessionEncounter, oldEncounter],
        [inSessionEncounter],
      );

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result.reasons).toEqual(['LOCATION_MISMATCH']);
      expect(result.reasons).not.toContain('SESSION_EXPIRED');
    });
  });

  describe('MULTIPLE_ENCOUNTERS_FOUND', () => {
    it('returns MULTIPLE_ENCOUNTERS_FOUND when more than one in-session own encounter found', async () => {
      const enc1 = createEncounter('enc-1', LOCATION_UUID);
      const enc2 = createEncounter('enc-2', LOCATION_UUID);
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearches([enc1, enc2], [enc1, enc2], [enc1, enc2]);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({
        matched: false,
        encounter: enc1,
        reasons: ['MULTIPLE_ENCOUNTERS_FOUND'],
      });
    });
  });

  describe('SESSION_EXPIRED', () => {
    it('returns [SESSION_EXPIRED] when expired encounter is at same location', async () => {
      const encounter = createEncounter('enc-1', LOCATION_UUID);
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearches([], [encounter], []);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({
        matched: false,
        encounter,
        reasons: ['SESSION_EXPIRED'],
      });
    });

    it('returns [SESSION_EXPIRED, LOCATION_MISMATCH] when expired encounter is at different location', async () => {
      const encounter = createEncounter('enc-1', 'different-location');
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearches([], [encounter], []);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({
        matched: false,
        encounter,
        reasons: ['SESSION_EXPIRED', 'LOCATION_MISMATCH'],
      });
    });
  });

  describe('PROVIDER_MISMATCH', () => {
    it('returns [PROVIDER_MISMATCH] when another provider has in-session encounter at same location', async () => {
      const encounter = createEncounter('enc-1', LOCATION_UUID);
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearches([], [], [encounter]);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({
        matched: false,
        encounter,
        reasons: ['PROVIDER_MISMATCH'],
      });
    });

    it('returns [PROVIDER_MISMATCH, LOCATION_MISMATCH] when another provider at different location', async () => {
      const encounter = createEncounter('enc-1', 'different-location');
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearches([], [], [encounter]);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({
        matched: false,
        encounter,
        reasons: ['PROVIDER_MISMATCH', 'LOCATION_MISMATCH'],
      });
    });
  });

  describe('combined reasons', () => {
    it('returns [SESSION_EXPIRED, PROVIDER_MISMATCH] when both exist simultaneously', async () => {
      const expiredEncounter = createEncounter('enc-expired', LOCATION_UUID);
      const otherProviderEncounter = createEncounter(
        'enc-other',
        LOCATION_UUID,
      );
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearches([], [expiredEncounter], [otherProviderEncounter]);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result.reasons).toEqual(['SESSION_EXPIRED', 'PROVIDER_MISMATCH']);
      expect(result.encounter).toEqual(expiredEncounter);
    });

    it('returns [SESSION_EXPIRED, LOCATION_MISMATCH, PROVIDER_MISMATCH] when all three apply', async () => {
      const expiredEncounter = createEncounter('enc-expired', 'other-loc');
      const otherProviderEncounter = createEncounter('enc-other', 'other-loc');
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearches([], [expiredEncounter], [otherProviderEncounter]);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result.reasons).toEqual([
        'SESSION_EXPIRED',
        'LOCATION_MISMATCH',
        'PROVIDER_MISMATCH',
      ]);
    });
  });

  describe('NO_ACTIVE_ENCOUNTER', () => {
    it('returns NO_ACTIVE_ENCOUNTER when no encounters found in any search', async () => {
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearches([], [], []);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({
        matched: false,
        encounter: null,
        reasons: ['NO_ACTIVE_ENCOUNTER'],
      });
    });

    it('returns NO_ACTIVE_ENCOUNTER when encounters found but none belong to active visit', async () => {
      const wrongVisitEncounter: Encounter = {
        ...createEncounter('enc-1', LOCATION_UUID),
        partOf: { reference: 'Encounter/different-visit' },
      };
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearches(
        [wrongVisitEncounter],
        [wrongVisitEncounter],
        [wrongVisitEncounter],
      );

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({
        matched: false,
        encounter: null,
        reasons: ['NO_ACTIVE_ENCOUNTER'],
      });
    });
  });

  describe('search parameter correctness', () => {
    it('runs all three searches in parallel with correct params', async () => {
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearches([], [], []);

      await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      const calls = mockSearchEncounters.mock.calls;
      expect(calls).toHaveLength(3);

      expect(calls[0][0]).toMatchObject({
        patient: PATIENT_UUID,
        participant: PRACTITIONER_UUID,
      });
      expect(calls[0][0]._lastUpdated).toMatch(/^ge/);

      expect(calls[1][0]).toMatchObject({
        patient: PATIENT_UUID,
        participant: PRACTITIONER_UUID,
      });
      expect(calls[1][0]._lastUpdated).toBeUndefined();

      expect(calls[2][0]).toMatchObject({ patient: PATIENT_UUID });
      expect(calls[2][0].participant).toBeUndefined();
      expect(calls[2][0]._lastUpdated).toMatch(/^ge/);
    });

    it('works without encounterTypeUUID', async () => {
      mockGetActiveVisit.mockResolvedValue(null);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
      );

      expect(result.reasons).toEqual(['NO_ACTIVE_VISIT']);
    });
  });

  describe('error handling', () => {
    it('returns NO_ACTIVE_ENCOUNTER and logs error when getActiveVisit throws', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGetActiveVisit.mockRejectedValue(new Error('Network error'));

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({
        matched: false,
        encounter: null,
        reasons: ['NO_ACTIVE_ENCOUNTER'],
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in resolveEncounterMatchDecision:',
        'Network error',
      );
      consoleSpy.mockRestore();
    });

    it('returns NO_ACTIVE_ENCOUNTER when searchEncounters throws', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearchEncounters.mockRejectedValue(new Error('API timeout'));

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({
        matched: false,
        encounter: null,
        reasons: ['NO_ACTIVE_ENCOUNTER'],
      });
      consoleSpy.mockRestore();
    });
  });
});
