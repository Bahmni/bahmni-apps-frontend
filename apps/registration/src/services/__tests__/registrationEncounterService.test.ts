import {
  createFhirEncounter,
  getUserLoginLocation,
  getCurrentUser,
  getCurrentProvider,
  get,
} from '@bahmni/services';
import type { Encounter } from 'fhir/r4';
import { buildRegistrationEncounterPayload } from '../../utils/fhirEncounterMapper';
import {
  createRegistrationEncounterForPatient,
  getEncounterTypeUuidByName,
} from '../registrationEncounterService';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  createFhirEncounter: jest.fn(),
  getUserLoginLocation: jest.fn(),
  getCurrentUser: jest.fn(),
  getCurrentProvider: jest.fn(),
  get: jest.fn(),
  dispatchAuditEvent: jest.fn(),
  AUDIT_LOG_EVENT_DETAILS: {
    EDIT_ENCOUNTER: { eventType: 'EDIT_ENCOUNTER' },
  },
  MODULE_LABELS: { REGISTRATION: 'registration', CLINICAL: 'clinical' },
}));

jest.mock('../../utils/fhirEncounterMapper', () => ({
  buildRegistrationEncounterPayload: jest.fn().mockReturnValue({
    resourceType: 'Encounter',
    status: 'in-progress',
  }),
}));

const mockBuildRegistrationEncounterPayload =
  buildRegistrationEncounterPayload as jest.MockedFunction<
    typeof buildRegistrationEncounterPayload
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
        messageParams: {
          encounterUuid: 'new-enc-uuid',
          encounterType: 'Registration',
        },
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
        messageParams: {
          encounterUuid: 'new-enc-uuid',
          encounterType: ENCOUNTER_TYPE_UUID,
        },
      }),
    );
  });

  it('should log EDIT_ENCOUNTER for the registration module with encounter and patient identifiers', async () => {
    await createRegistrationEncounterForPatient(
      PATIENT_UUID,
      ENCOUNTER_TYPE_UUID,
    );

    expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
      eventType: 'EDIT_ENCOUNTER',
      patientUuid: PATIENT_UUID,
      messageParams: {
        encounterUuid: 'new-enc-uuid',
        encounterType: ENCOUNTER_TYPE_UUID,
      },
      module: 'registration',
    });
  });

  it('should POST an encounter linked to the visit via partOf when visit options are provided', async () => {
    // The service's responsibility is to pass the visit linkage details to the
    // payload builder (which owns partOf/period construction) and then POST the
    // result. The mapper is unit-tested separately.
    await createRegistrationEncounterForPatient(
      PATIENT_UUID,
      ENCOUNTER_TYPE_UUID,
      { visitUuid: VISIT_UUID, periodStart: VISIT_START },
    );

    expect(mockBuildRegistrationEncounterPayload).toHaveBeenCalledWith(
      expect.objectContaining({
        visitUuid: VISIT_UUID,
        periodStart: VISIT_START,
      }),
    );
    expect(mockCreateFhirEncounter).toHaveBeenCalled();
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
