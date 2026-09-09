import { createVisitWithFhirR4 } from '../fhirVisitService';

const mockPost = jest.fn();

jest.mock('../../api', () => ({
  post: (...args: any[]) => mockPost(...args),
}));

const PATIENT_UUID = 'patient-uuid-1';
const LOCATION_UUID = 'location-uuid-1';
const VISIT_TYPE_UUID = 'visit-type-uuid-1';

describe('fhirVisitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockResolvedValue({});
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
});
