import { Encounter } from 'fhir/r4';
import { getActiveVisit } from '../../encounterService';
import {
  searchEncounters,
  filterByActiveVisit,
  getEncounterSessionDuration,
} from '../encounterSessionService';
import { resolveEncounterMatchDecision } from '../encounterMatchDecisionMapper';

jest.mock('../../encounterService');
jest.mock('../encounterSessionService');

const mockGetActiveVisit = getActiveVisit as jest.MockedFunction<typeof getActiveVisit>;
const mockSearchEncounters = searchEncounters as jest.MockedFunction<typeof searchEncounters>;
const mockFilterByActiveVisit = filterByActiveVisit as jest.MockedFunction<typeof filterByActiveVisit>;
const mockGetEncounterSessionDuration = getEncounterSessionDuration as jest.MockedFunction<typeof getEncounterSessionDuration>;

const PATIENT_UUID = 'patient-123';
const PRACTITIONER_UUID = 'practitioner-456';
const LOCATION_UUID = 'location-789';
const ENCOUNTER_TYPE_UUID = 'encounter-type-abc';
const VISIT_UUID = 'visit-111';

const createActiveVisit = (): Encounter => ({
  resourceType: 'Encounter',
  id: VISIT_UUID,
  status: 'in-progress',
  class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB' },
});

const createEncounter = (locationUUID?: string): Encounter => ({
  resourceType: 'Encounter',
  id: 'encounter-222',
  status: 'finished',
  class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB' },
  partOf: { reference: `Encounter/${VISIT_UUID}` },
  ...(locationUUID && {
    location: [{ location: { reference: `Location/${locationUUID}` } }],
  }),
});

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

      expect(result).toEqual({ matched: false, encounter: null, reason: 'NO_ACTIVE_VISIT' });
      expect(mockSearchEncounters).not.toHaveBeenCalled();
    });
  });

  describe('MATCHED', () => {
    it('returns MATCHED when in-session encounter belongs to active visit and location matches', async () => {
      const encounter = createEncounter(LOCATION_UUID);
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearchEncounters.mockResolvedValueOnce([encounter]); // in-session + practitioner
      mockFilterByActiveVisit.mockResolvedValueOnce(encounter);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({ matched: true, encounter, reason: 'MATCHED' });
      expect(mockSearchEncounters).toHaveBeenCalledTimes(1);
    });
  });

  describe('LOCATION_MISMATCH', () => {
    it('returns LOCATION_MISMATCH when in-session encounter is found but location differs', async () => {
      const encounter = createEncounter('different-location-uuid');
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearchEncounters.mockResolvedValueOnce([encounter]);
      mockFilterByActiveVisit.mockResolvedValueOnce(encounter);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({ matched: false, encounter, reason: 'LOCATION_MISMATCH' });
      expect(mockSearchEncounters).toHaveBeenCalledTimes(1);
    });

    it('returns LOCATION_MISMATCH when encounter has no location entries', async () => {
      const encounter = createEncounter(); // no location field
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearchEncounters.mockResolvedValueOnce([encounter]);
      mockFilterByActiveVisit.mockResolvedValueOnce(encounter);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({ matched: false, encounter, reason: 'LOCATION_MISMATCH' });
    });
  });

  describe('SESSION_EXPIRED', () => {
    it('returns SESSION_EXPIRED when encounter exists all-time for practitioner but not in session window', async () => {
      const encounter = createEncounter(LOCATION_UUID);
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearchEncounters
        .mockResolvedValueOnce([])          // step 2: in-session + practitioner → empty
        .mockResolvedValueOnce([encounter]); // step 3: all-time + practitioner → found
      mockFilterByActiveVisit.mockResolvedValueOnce(encounter);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({ matched: false, encounter, reason: 'SESSION_EXPIRED' });
      expect(mockSearchEncounters).toHaveBeenCalledTimes(2);
    });

    it('returns SESSION_EXPIRED when in-session filterByActiveVisit returns null but all-time search finds encounter', async () => {
      const encounter = createEncounter(LOCATION_UUID);
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearchEncounters
        .mockResolvedValueOnce([encounter])  // step 2: in-session has encounters
        .mockResolvedValueOnce([encounter]); // step 3: all-time also finds it
      mockFilterByActiveVisit
        .mockResolvedValueOnce(null)         // step 2: not in active visit
        .mockResolvedValueOnce(encounter);   // step 3: found in active visit

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({ matched: false, encounter, reason: 'SESSION_EXPIRED' });
    });
  });

  describe('PROVIDER_MISMATCH', () => {
    it('returns PROVIDER_MISMATCH when another provider has an encounter in session', async () => {
      const encounter = createEncounter(LOCATION_UUID);
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearchEncounters
        .mockResolvedValueOnce([])           // step 2: in-session + practitioner → empty
        .mockResolvedValueOnce([])           // step 3: all-time + practitioner → empty
        .mockResolvedValueOnce([encounter]); // step 4: in-session, no practitioner → found
      mockFilterByActiveVisit.mockResolvedValueOnce(encounter);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({ matched: false, encounter, reason: 'PROVIDER_MISMATCH' });
      expect(mockSearchEncounters).toHaveBeenCalledTimes(3);
    });
  });

  describe('NO_ACTIVE_ENCOUNTER', () => {
    it('returns NO_ACTIVE_ENCOUNTER when no encounters found in any search', async () => {
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearchEncounters.mockResolvedValue([]); // all 3 searches return empty

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({ matched: false, encounter: null, reason: 'NO_ACTIVE_ENCOUNTER' });
      expect(mockSearchEncounters).toHaveBeenCalledTimes(3);
      expect(mockFilterByActiveVisit).not.toHaveBeenCalled();
    });

    it('returns NO_ACTIVE_ENCOUNTER when all searches find encounters but none match active visit', async () => {
      const encounter = createEncounter(LOCATION_UUID);
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearchEncounters
        .mockResolvedValueOnce([encounter])  // step 2
        .mockResolvedValueOnce([encounter])  // step 3
        .mockResolvedValueOnce([encounter]); // step 4
      mockFilterByActiveVisit.mockResolvedValue(null); // none match active visit

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({ matched: false, encounter: null, reason: 'NO_ACTIVE_ENCOUNTER' });
    });
  });

  describe('search parameter correctness', () => {
    it('passes correct params to each searchEncounters call', async () => {
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearchEncounters.mockResolvedValue([]);

      await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      const calls = mockSearchEncounters.mock.calls;

      // Step 2: in-session + practitioner
      expect(calls[0][0]).toMatchObject({
        patient: PATIENT_UUID,
        _tag: 'encounter',
        participant: PRACTITIONER_UUID,
        type: ENCOUNTER_TYPE_UUID,
      });
      expect(calls[0][0]._lastUpdated).toMatch(/^ge/);

      // Step 3: all-time + practitioner (no _lastUpdated)
      expect(calls[1][0]).toMatchObject({
        patient: PATIENT_UUID,
        _tag: 'encounter',
        participant: PRACTITIONER_UUID,
        type: ENCOUNTER_TYPE_UUID,
      });
      expect(calls[1][0]._lastUpdated).toBeUndefined();

      // Step 4: in-session, no practitioner filter
      expect(calls[2][0]).toMatchObject({
        patient: PATIENT_UUID,
        _tag: 'encounter',
        type: ENCOUNTER_TYPE_UUID,
      });
      expect(calls[2][0].participant).toBeUndefined();
      expect(calls[2][0]._lastUpdated).toMatch(/^ge/);
    });

    it('works without encounterTypeUUID (optional param)', async () => {
      mockGetActiveVisit.mockResolvedValue(null);

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
      );

      expect(result.reason).toBe('NO_ACTIVE_VISIT');
    });
  });

  describe('error handling', () => {
    it('returns NO_ACTIVE_ENCOUNTER and logs error when getActiveVisit throws', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetActiveVisit.mockRejectedValue(new Error('Network error'));

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({ matched: false, encounter: null, reason: 'NO_ACTIVE_ENCOUNTER' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in resolveEncounterMatchDecision:',
        'Network error',
      );
      consoleSpy.mockRestore();
    });

    it('returns NO_ACTIVE_ENCOUNTER when searchEncounters throws', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearchEncounters.mockRejectedValue(new Error('API timeout'));

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({ matched: false, encounter: null, reason: 'NO_ACTIVE_ENCOUNTER' });
      consoleSpy.mockRestore();
    });

    it('returns NO_ACTIVE_ENCOUNTER when filterByActiveVisit throws', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const encounter = createEncounter(LOCATION_UUID);
      mockGetActiveVisit.mockResolvedValue(createActiveVisit());
      mockSearchEncounters.mockResolvedValueOnce([encounter]);
      mockFilterByActiveVisit.mockRejectedValue(new Error('Unexpected error'));

      const result = await resolveEncounterMatchDecision(
        PATIENT_UUID,
        PRACTITIONER_UUID,
        LOCATION_UUID,
        ENCOUNTER_TYPE_UUID,
      );

      expect(result).toEqual({ matched: false, encounter: null, reason: 'NO_ACTIVE_ENCOUNTER' });
      consoleSpy.mockRestore();
    });
  });
});
