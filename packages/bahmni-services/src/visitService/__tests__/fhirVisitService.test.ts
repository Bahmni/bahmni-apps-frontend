import {
  createVisitWithFhirR4,
  getActiveVisitAtLoginLocation,
} from '../fhirVisitService';

const mockPost = jest.fn();
const mockGetActiveVisit = jest.fn();
const mockGetUserLoginLocation = jest.fn();
const mockGetVisitLocationUUID = jest.fn();

jest.mock('../../api', () => ({
  post: (...args: any[]) => mockPost(...args),
}));

jest.mock('../../encounterService', () => ({
  getActiveVisit: (...args: any[]) => mockGetActiveVisit(...args),
}));

jest.mock('../../userService', () => ({
  getUserLoginLocation: () => mockGetUserLoginLocation(),
}));

jest.mock('../visitService', () => ({
  getVisitLocationUUID: (...args: any[]) => mockGetVisitLocationUUID(...args),
}));

const PATIENT_UUID = 'patient-uuid-1';
const LOCATION_UUID = 'location-uuid-1';
const VISIT_TYPE_UUID = 'visit-type-uuid-1';
const LOGIN_LOCATION_UUID = 'login-loc-uuid';
const VISIT_LOCATION_UUID = 'visit-loc-uuid';

const makeVisit = (locationRef: string, hasEnd = false) => ({
  resourceType: 'Encounter' as const,
  id: 'visit-1',
  period: hasEnd
    ? { start: '2024-01-01', end: '2024-01-02' }
    : { start: '2024-01-01' },
  location: [{ location: { reference: locationRef } }],
});

describe('fhirVisitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockResolvedValue({});
    mockGetUserLoginLocation.mockReturnValue({ uuid: LOGIN_LOCATION_UUID });
    mockGetVisitLocationUUID.mockResolvedValue({ uuid: VISIT_LOCATION_UUID });
    mockGetActiveVisit.mockResolvedValue(null);
  });

  it('posts correct FHIR Encounter resource to create a visit', async () => {
    await createVisitWithFhirR4(PATIENT_UUID, LOCATION_UUID, VISIT_TYPE_UUID);

    expect(mockPost).toHaveBeenCalledWith(
      '/openmrs/ws/fhir2/R4/Encounter',
      expect.objectContaining({
        resourceType: 'Encounter',
        status: 'in-progress',
        type: expect.arrayContaining([
          expect.objectContaining({
            coding: expect.arrayContaining([
              expect.objectContaining({ code: VISIT_TYPE_UUID }),
            ]),
          }),
        ]),
        subject: { reference: `Patient/${PATIENT_UUID}`, type: 'Patient' },
        location: expect.arrayContaining([
          expect.objectContaining({
            location: expect.objectContaining({
              reference: `Location/${LOCATION_UUID}`,
            }),
          }),
        ]),
        meta: expect.objectContaining({
          tag: expect.arrayContaining([
            expect.objectContaining({ code: 'visit' }),
          ]),
        }),
        period: expect.objectContaining({ start: expect.any(String) }),
      }),
    );
  });

  it('does not include episodeOfCare when episodeUuid is omitted', async () => {
    await createVisitWithFhirR4(PATIENT_UUID, LOCATION_UUID, VISIT_TYPE_UUID);

    expect(mockPost).toHaveBeenCalledWith(
      '/openmrs/ws/fhir2/R4/Encounter',
      expect.not.objectContaining({ episodeOfCare: expect.anything() }),
    );
  });

  it('includes episodeOfCare reference when episodeUuid is provided', async () => {
    const EPISODE_UUID = 'episode-uuid-1';
    await createVisitWithFhirR4(
      PATIENT_UUID,
      LOCATION_UUID,
      VISIT_TYPE_UUID,
      EPISODE_UUID,
    );

    expect(mockPost).toHaveBeenCalledWith(
      '/openmrs/ws/fhir2/R4/Encounter',
      expect.objectContaining({
        episodeOfCare: [{ reference: `EpisodeOfCare/${EPISODE_UUID}` }],
      }),
    );
  });

  it('returns the resolved value from post', async () => {
    const mockEncounter = { resourceType: 'Encounter', id: 'new-enc-1' };
    mockPost.mockResolvedValue(mockEncounter);

    const result = await createVisitWithFhirR4(
      PATIENT_UUID,
      LOCATION_UUID,
      VISIT_TYPE_UUID,
    );

    expect(result).toBe(mockEncounter);
  });

  it('propagates rejection from post', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    await expect(
      createVisitWithFhirR4(PATIENT_UUID, LOCATION_UUID, VISIT_TYPE_UUID),
    ).rejects.toThrow('Network error');
  });

  it('returns null when no active visit exists at login location', async () => {
    mockGetActiveVisit.mockResolvedValue(null);

    const result = await getActiveVisitAtLoginLocation(PATIENT_UUID);

    expect(result).toBeNull();
    expect(mockGetActiveVisit).toHaveBeenCalledWith(
      PATIENT_UUID,
      VISIT_LOCATION_UUID,
    );
  });

  it('returns the active visit at the login location', async () => {
    const activeVisit = makeVisit(`Location/${VISIT_LOCATION_UUID}`);
    mockGetActiveVisit.mockResolvedValue(activeVisit);

    const result = await getActiveVisitAtLoginLocation(PATIENT_UUID);

    expect(result).toBe(activeVisit);
    expect(mockGetActiveVisit).toHaveBeenCalledWith(
      PATIENT_UUID,
      VISIT_LOCATION_UUID,
    );
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

  it('rejects when getActiveVisit rejects', async () => {
    mockGetActiveVisit.mockRejectedValue(new Error('Fetch error'));

    await expect(getActiveVisitAtLoginLocation(PATIENT_UUID)).rejects.toThrow(
      'Fetch error',
    );
  });

  it('passes login location UUID to getVisitLocationUUID', async () => {
    await getActiveVisitAtLoginLocation(PATIENT_UUID);

    expect(mockGetVisitLocationUUID).toHaveBeenCalledWith(LOGIN_LOCATION_UUID);
  });

  it('passes patient UUID and visit location UUID to getActiveVisit', async () => {
    await getActiveVisitAtLoginLocation(PATIENT_UUID);

    expect(mockGetActiveVisit).toHaveBeenCalledWith(
      PATIENT_UUID,
      VISIT_LOCATION_UUID,
    );
  });
});
