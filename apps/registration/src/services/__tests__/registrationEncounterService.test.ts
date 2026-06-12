import {
  getActiveVisitByPatient,
  getEncounterSessionDuration,
  searchEncounters,
  updateFhirEncounter,
  createFhirEncounter,
  getUserLoginLocation,
  getCurrentUser,
  getCurrentProvider,
  get,
} from '@bahmni/services';
import type { Encounter } from 'fhir/r4';
import {
  createRegistrationEncounterForPatient,
  findValidRegistrationEncounterInSession,
  getEncounterTypeUuidByName,
  linkRegistrationEncounterToVisit,
} from '../registrationEncounterService';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getActiveVisitByPatient: jest.fn(),
  getEncounterSessionDuration: jest.fn(),
  searchEncounters: jest.fn(),
  updateFhirEncounter: jest.fn(),
  createFhirEncounter: jest.fn(),
  getUserLoginLocation: jest.fn(),
  getCurrentUser: jest.fn(),
  getCurrentProvider: jest.fn(),
  get: jest.fn(),
  dispatchAuditEvent: jest.fn(),
  AUDIT_LOG_EVENT_DETAILS: {
    CREATE_ENCOUNTER: { eventType: 'CREATE_ENCOUNTER', module: 'registration' },
  },
}));

jest.mock('../../utils/fhirEncounterMapper', () => ({
  buildRegistrationEncounterPayload: jest.fn().mockReturnValue({
    resourceType: 'Encounter',
    status: 'in-progress',
  }),
}));

const mockGetActiveVisitByPatient =
  getActiveVisitByPatient as jest.MockedFunction<
    typeof getActiveVisitByPatient
  >;
const mockGetEncounterSessionDuration =
  getEncounterSessionDuration as jest.MockedFunction<
    typeof getEncounterSessionDuration
  >;
const mockSearchEncounters = searchEncounters as jest.MockedFunction<
  typeof searchEncounters
>;
const mockUpdateFhirEncounter = updateFhirEncounter as jest.MockedFunction<
  typeof updateFhirEncounter
>;
const mockCreateFhirEncounter = createFhirEncounter as jest.MockedFunction<
  typeof createFhirEncounter
>;
const mockGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockGetCurrentProvider = getCurrentProvider as jest.MockedFunction<
  typeof getCurrentProvider
>;
const mockGet = get as jest.MockedFunction<typeof get>;

const PATIENT_UUID = 'patient-uuid-123';
const ENCOUNTER_TYPE_UUID = 'enc-type-uuid-456';
const VISIT_UUID = 'visit-uuid-789';
const VISIT_START = '2026-06-08T08:00:00.000Z';
const SESSION_DURATION_MINUTES = 60;

const makeEncounter = (overrides: Partial<Encounter> = {}): Encounter => ({
  resourceType: 'Encounter',
  status: 'in-progress',
  id: 'enc-uuid-001',
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
  },
  period: { start: new Date().toISOString() },
  ...overrides,
});

const makeExpiredEncounter = (overrides: Partial<Encounter> = {}): Encounter =>
  makeEncounter({
    period: {
      start: new Date(
        Date.now() - (SESSION_DURATION_MINUTES + 30) * 60 * 1000,
      ).toISOString(),
    },
    ...overrides,
  });

describe('createRegistrationEncounterForPatient', () => {
  const mockDispatchAuditEvent =
    jest.requireMock('@bahmni/services').dispatchAuditEvent;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserLoginLocation.mockReturnValue({
      uuid: 'location-uuid',
      name: 'Test Location',
    });
    mockGetCurrentUser.mockResolvedValue({
      uuid: 'user-uuid',
      display: 'Test User',
      systemId: 'admin',
      userProperties: {},
      person: { uuid: 'person-uuid' },
      roles: [],
      privileges: [],
    });
    mockGetCurrentProvider.mockResolvedValue({
      uuid: 'provider-uuid',
      display: 'Test Provider',
      person: { uuid: 'person-uuid', display: 'Test Provider' },
    });
    mockCreateFhirEncounter.mockResolvedValue(
      makeEncounter({ id: 'new-enc-uuid' }),
    );
  });

  it('should fetch location, user and provider then create and return the encounter', async () => {
    const result = await createRegistrationEncounterForPatient(
      PATIENT_UUID,
      ENCOUNTER_TYPE_UUID,
    );

    expect(mockGetUserLoginLocation).toHaveBeenCalled();
    expect(mockGetCurrentUser).toHaveBeenCalled();
    expect(mockGetCurrentProvider).toHaveBeenCalledWith('user-uuid');
    expect(mockCreateFhirEncounter).toHaveBeenCalled();
    expect(result.id).toBe('new-enc-uuid');
  });

  it('should not call getCurrentProvider when user is null', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    await createRegistrationEncounterForPatient(
      PATIENT_UUID,
      ENCOUNTER_TYPE_UUID,
    );

    expect(mockGetCurrentProvider).not.toHaveBeenCalled();
  });

  it('should dispatch audit event with encounter type display name from FHIR response', async () => {
    mockCreateFhirEncounter.mockResolvedValue(
      makeEncounter({
        id: 'new-enc-uuid',
        type: [
          { coding: [{ display: 'Registration', code: ENCOUNTER_TYPE_UUID }] },
        ],
      }),
    );

    await createRegistrationEncounterForPatient(
      PATIENT_UUID,
      ENCOUNTER_TYPE_UUID,
    );

    expect(mockDispatchAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        messageParams: { encounterType: 'Registration' },
      }),
    );
  });

  it('should fall back to encounterTypeUuid in audit event when no display name in response', async () => {
    await createRegistrationEncounterForPatient(
      PATIENT_UUID,
      ENCOUNTER_TYPE_UUID,
    );

    expect(mockDispatchAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        messageParams: { encounterType: ENCOUNTER_TYPE_UUID },
      }),
    );
  });
});

describe('findValidRegistrationEncounterInSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEncounterSessionDuration.mockResolvedValue(SESSION_DURATION_MINUTES);
  });

  it('should return the encounter when period.start is within the session window', async () => {
    const encounter = makeEncounter();
    mockSearchEncounters.mockResolvedValue([encounter]);

    const result = await findValidRegistrationEncounterInSession(
      PATIENT_UUID,
      ENCOUNTER_TYPE_UUID,
    );

    expect(result).toEqual(encounter);
    expect(mockSearchEncounters).toHaveBeenCalledWith(
      expect.objectContaining({
        patient: PATIENT_UUID,
        type: ENCOUNTER_TYPE_UUID,
        _lastUpdated: expect.stringMatching(/^ge/),
      }),
    );
  });

  it('should return null when no encounters exist', async () => {
    mockSearchEncounters.mockResolvedValue([]);

    const result = await findValidRegistrationEncounterInSession(
      PATIENT_UUID,
      ENCOUNTER_TYPE_UUID,
    );

    expect(result).toBeNull();
  });

  it('should return null when server returns encounters whose period.start has expired', async () => {
    mockSearchEncounters.mockResolvedValue([makeExpiredEncounter()]);

    const result = await findValidRegistrationEncounterInSession(
      PATIENT_UUID,
      ENCOUNTER_TYPE_UUID,
    );

    expect(result).toBeNull();
  });

  it('should return the most recent valid encounter when multiple exist in session', async () => {
    const olderEncounter = makeEncounter({
      id: 'enc-older',
      period: { start: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    });
    const newerEncounter = makeEncounter({
      id: 'enc-newer',
      period: { start: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
    });

    // Server returns older first — sort should return newer
    mockSearchEncounters.mockResolvedValue([olderEncounter, newerEncounter]);

    const result = await findValidRegistrationEncounterInSession(
      PATIENT_UUID,
      ENCOUNTER_TYPE_UUID,
    );

    expect(result?.id).toBe('enc-newer');
  });
});

describe('linkRegistrationEncounterToVisit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActiveVisitByPatient.mockResolvedValue({
      results: [
        {
          uuid: VISIT_UUID,
          startDatetime: VISIT_START,
          visitType: { uuid: 'visit-type-uuid', name: 'OPD' },
          stopDatetime: null,
        },
      ],
    });
    mockGetEncounterSessionDuration.mockResolvedValue(SESSION_DURATION_MINUTES);
    mockGetUserLoginLocation.mockReturnValue({
      uuid: 'location-uuid',
      name: 'Test Location',
    });
    mockGetCurrentUser.mockResolvedValue({
      uuid: 'user-uuid',
      display: 'Test User',
      systemId: 'admin',
      userProperties: {},
      person: { uuid: 'person-uuid' },
      roles: [],
      privileges: [],
    });
    mockGetCurrentProvider.mockResolvedValue({
      uuid: 'provider-uuid',
      display: 'Test Provider',
      person: { uuid: 'person-uuid', display: 'Test Provider' },
    });
    mockUpdateFhirEncounter.mockResolvedValue(makeEncounter());
    mockCreateFhirEncounter.mockResolvedValue(
      makeEncounter({ id: 'new-enc-uuid' }),
    );
  });

  it('should link existing unlinked encounter to visit when within session duration', async () => {
    const unlinkedEncounter = makeEncounter({ id: 'enc-uuid-001' });
    mockSearchEncounters.mockResolvedValue([unlinkedEncounter]);

    await linkRegistrationEncounterToVisit(PATIENT_UUID, ENCOUNTER_TYPE_UUID);

    expect(mockUpdateFhirEncounter).toHaveBeenCalledWith(
      'enc-uuid-001',
      expect.objectContaining({
        period: { start: new Date(VISIT_START).toISOString() },
        partOf: { reference: `Encounter/${VISIT_UUID}` },
      }),
    );
    expect(mockCreateFhirEncounter).not.toHaveBeenCalled();
  });

  it('should do nothing when no valid registration encounter exists', async () => {
    mockSearchEncounters.mockResolvedValue([]);

    await linkRegistrationEncounterToVisit(PATIENT_UUID, ENCOUNTER_TYPE_UUID);

    expect(mockCreateFhirEncounter).not.toHaveBeenCalled();
    expect(mockUpdateFhirEncounter).not.toHaveBeenCalled();
  });

  it('should do nothing when all registration encounters are expired', async () => {
    mockSearchEncounters.mockResolvedValue([makeExpiredEncounter()]);

    await linkRegistrationEncounterToVisit(PATIENT_UUID, ENCOUNTER_TYPE_UUID);

    expect(mockCreateFhirEncounter).not.toHaveBeenCalled();
    expect(mockUpdateFhirEncounter).not.toHaveBeenCalled();
  });

  it('should relink the most recent valid encounter to the active visit even when already linked', async () => {
    const linkedEncounter = makeEncounter({
      id: 'enc-uuid-002',
      partOf: { reference: 'Encounter/old-visit' },
    });

    mockSearchEncounters.mockResolvedValue([linkedEncounter]);

    await linkRegistrationEncounterToVisit(PATIENT_UUID, ENCOUNTER_TYPE_UUID);

    expect(mockUpdateFhirEncounter).toHaveBeenCalledWith(
      'enc-uuid-002',
      expect.objectContaining({
        partOf: { reference: `Encounter/${VISIT_UUID}` },
      }),
    );

    expect(mockCreateFhirEncounter).not.toHaveBeenCalled();
  });

  it('should not create a duplicate encounter when a valid one already exists in session', async () => {
    const existingEncounter = makeEncounter({ id: 'enc-existing' });
    mockSearchEncounters.mockResolvedValue([existingEncounter]);

    await linkRegistrationEncounterToVisit(PATIENT_UUID, ENCOUNTER_TYPE_UUID);

    expect(mockCreateFhirEncounter).not.toHaveBeenCalled();
  });

  it('should link the most recent unlinked encounter when multiple exist in session', async () => {
    const olderEncounter = makeEncounter({
      id: 'enc-older',
      period: { start: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    });
    const newerEncounter = makeEncounter({
      id: 'enc-newer',
      period: { start: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
    });

    // Server returns older first — sort should pick newer
    mockSearchEncounters.mockResolvedValue([olderEncounter, newerEncounter]);

    await linkRegistrationEncounterToVisit(PATIENT_UUID, ENCOUNTER_TYPE_UUID);

    expect(mockUpdateFhirEncounter).toHaveBeenCalledWith(
      'enc-newer',
      expect.objectContaining({
        partOf: { reference: `Encounter/${VISIT_UUID}` },
      }),
    );
    expect(mockUpdateFhirEncounter).toHaveBeenCalledTimes(1);
  });

  it('should treat encounter as expired when session boundary is exactly reached', async () => {
    const startTime = new Date(
      Date.now() - SESSION_DURATION_MINUTES * 60 * 1000,
    );

    const boundaryEncounter = makeEncounter({
      period: { start: startTime.toISOString() },
    });

    mockSearchEncounters.mockResolvedValue([boundaryEncounter]);

    const result = await findValidRegistrationEncounterInSession(
      PATIENT_UUID,
      ENCOUNTER_TYPE_UUID,
    );

    expect(result).toBeNull();
  });

  it('should no-op when patient has no active visit', async () => {
    mockGetActiveVisitByPatient.mockResolvedValue({ results: [] });

    await linkRegistrationEncounterToVisit(PATIENT_UUID, ENCOUNTER_TYPE_UUID);

    expect(mockSearchEncounters).not.toHaveBeenCalled();
    expect(mockUpdateFhirEncounter).not.toHaveBeenCalled();
    expect(mockCreateFhirEncounter).not.toHaveBeenCalled();
  });
});

describe('getEncounterTypeUuidByName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the uuid when the encounter type name matches', async () => {
    mockGet.mockResolvedValue({
      results: [
        { uuid: 'uuid-001', name: 'Registration' },
        { uuid: 'uuid-002', name: 'OPD' },
      ],
    });

    const result = await getEncounterTypeUuidByName('Registration');

    expect(result).toBe('uuid-001');
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('q=Registration'),
    );
  });

  it('should return undefined when no encounter type matches the name', async () => {
    mockGet.mockResolvedValue({
      results: [{ uuid: 'uuid-001', name: 'OPD' }],
    });

    const result = await getEncounterTypeUuidByName('Registration');

    expect(result).toBeUndefined();
  });

  it('should return undefined when results are empty', async () => {
    mockGet.mockResolvedValue({ results: [] });

    const result = await getEncounterTypeUuidByName('Registration');

    expect(result).toBeUndefined();
  });

  it('should URL-encode the name in the query', async () => {
    mockGet.mockResolvedValue({ results: [] });

    await getEncounterTypeUuidByName('Clinic Visit Type');

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('q=Clinic%20Visit%20Type'),
    );
  });
});
