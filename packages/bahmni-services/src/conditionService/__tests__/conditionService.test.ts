import { Encounter } from 'fhir/r4';
import { get, put, post } from '../../api';
import { ENCOUNTER_BUNDLE_URL } from '../../encounterBundle';
import { getUserLoginLocation } from '../../userService';
import {
  mockCondition,
  mockConditionBundle,
  mockEmptyConditionBundle,
  mockMalformedBundle,
} from '../__mocks__/mocks';
import {
  getConditions,
  getConditionsBundle,
  getConditionPage,
  markConditionAsInactive,
} from '../conditionService';

jest.mock('../../api');
jest.mock('../../userService');
jest.mock('../../utils/utils', () => ({
  ...jest.requireActual('../../utils/utils'),
  generateUUID: jest.fn(() => 'test-uuid-1234'),
}));

const mockedPost = post as jest.MockedFunction<typeof post>;
const mockedPut = put as jest.MockedFunction<typeof put>;
const mockedGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;

/** A persisted encounter as returned by the session store in MATCHED and mismatch cases */
const mockActiveEncounter: Encounter = {
  resourceType: 'Encounter',
  id: 'enc-session-123',
  status: 'in-progress',
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
  },
  type: [
    {
      coding: [
        {
          system: 'http://fhir.openmrs.org/code-system/encounter-type',
          code: 'enc-type-uuid',
          display: 'Consultation',
        },
      ],
    },
  ],
  subject: { reference: 'Patient/02f47490-d657-48ee-98e7-4c9133ea168b' },
  partOf: { reference: 'Encounter/visit-uuid-999', type: 'Encounter' },
  location: [
    {
      location: {
        reference: 'Location/loc-uuid-abc',
        type: 'Location',
      },
    },
  ],
};

describe('conditionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    mockedPost.mockResolvedValue({});
    mockedPut.mockResolvedValue({});
    mockedGetUserLoginLocation.mockReturnValue({
      uuid: 'login-location-uuid',
    } as ReturnType<typeof getUserLoginLocation>);
  });

  describe('getConditionsBundle', () => {
    it('should fetch condition bundle for a valid patient UUID', async () => {
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      (get as jest.Mock).mockResolvedValueOnce(mockConditionBundle);

      const result = await getConditionsBundle(patientUUID);

      expect(get).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/Condition?category=problem-list-item&patient=${patientUUID}&_count=100&_sort=-_lastUpdated`,
      );
      expect(result).toEqual(mockConditionBundle);
    });

    it('should propagate errors from the API', async () => {
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      const error = new Error('Network error');
      (get as jest.Mock).mockRejectedValueOnce(error);

      await expect(getConditionsBundle(patientUUID)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('getConditions', () => {
    it('should fetch conditions for a valid patient UUID', async () => {
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      (get as jest.Mock).mockResolvedValueOnce(mockConditionBundle);

      const result = await getConditions(patientUUID);

      expect(get).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/Condition?category=problem-list-item&patient=${patientUUID}&_count=100&_sort=-_lastUpdated`,
      );
      expect(result).toEqual([mockCondition]);
    });

    it('should return empty array when no conditions exist', async () => {
      const patientUUID = 'no-conditions';
      (get as jest.Mock).mockResolvedValueOnce(mockEmptyConditionBundle);

      const result = await getConditions(patientUUID);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle missing entry array', async () => {
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      const malformedResponse = { ...mockConditionBundle, entry: undefined };
      (get as jest.Mock).mockResolvedValueOnce(malformedResponse);

      const result = await getConditions(patientUUID);
      expect(result).toEqual([]);
    });

    it('should filter out invalid resource types', async () => {
      const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
      (get as jest.Mock).mockResolvedValueOnce(mockMalformedBundle);

      const result = await getConditions(patientUUID);
      expect(result).toEqual([]);
    });
  });

  describe('getConditionPage', () => {
    const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

    it('should fetch page 1 with default count', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockConditionBundle);

      const result = await getConditionPage(patientUUID);

      expect(get).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/Condition?category=problem-list-item&patient=${patientUUID}&_count=10&_getpagesoffset=0&_sort=-_lastUpdated`,
      );
      expect(result.conditions).toEqual([mockCondition]);
      expect(result.total).toBe(1);
    });

    it('should calculate correct offset for page 2', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockConditionBundle);

      await getConditionPage(patientUUID, 5, 2);

      expect(get).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/Condition?category=problem-list-item&patient=${patientUUID}&_count=5&_getpagesoffset=5&_sort=-_lastUpdated`,
      );
    });

    it('should calculate correct offset for page 3 with count 10', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockConditionBundle);

      await getConditionPage(patientUUID, 10, 3);

      expect(get).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/Condition?category=problem-list-item&patient=${patientUUID}&_count=10&_getpagesoffset=20&_sort=-_lastUpdated`,
      );
    });

    it('should return total from bundle', async () => {
      const bundleWithTotal = { ...mockConditionBundle, total: 42 };
      (get as jest.Mock).mockResolvedValueOnce(bundleWithTotal);

      const result = await getConditionPage(patientUUID, 10, 1);

      expect(result.total).toBe(42);
    });

    it('should return undefined total when bundle total is missing', async () => {
      const bundleWithoutTotal = { ...mockConditionBundle, total: undefined };
      (get as jest.Mock).mockResolvedValueOnce(bundleWithoutTotal);

      const result = await getConditionPage(patientUUID, 10, 1);

      expect(result.total).toBeUndefined();
    });

    it('should return empty conditions for empty bundle', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockEmptyConditionBundle);

      const result = await getConditionPage(patientUUID, 10, 1);

      expect(result.conditions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should propagate errors from the API', async () => {
      const error = new Error('Network error');
      (get as jest.Mock).mockRejectedValueOnce(error);

      await expect(getConditionPage(patientUUID)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('markConditionAsInactive', () => {
    describe('fallback — no encounter (NO_ACTIVE_ENCOUNTER)', () => {
      it('should use plain PUT when no activeEncounter is provided', async () => {
        mockedPut.mockImplementationOnce((_, body) => Promise.resolve(body));

        await markConditionAsInactive(mockCondition);

        expect(mockedPut).toHaveBeenCalledWith(
          `/openmrs/ws/fhir2/R4/Condition/${mockCondition.id}`,
          expect.objectContaining({
            clinicalStatus: expect.objectContaining({
              coding: expect.arrayContaining([
                expect.objectContaining({ code: 'inactive' }),
              ]),
            }),
          }),
        );
        expect(mockedPost).not.toHaveBeenCalled();
      });

      it('should not include an encounter reference when no activeEncounter is provided', async () => {
        mockedPut.mockImplementationOnce((_, body) => Promise.resolve(body));

        const result = await markConditionAsInactive(mockCondition);

        expect((result as { encounter?: unknown }).encounter).toBeUndefined();
      });

      it('should set category to problem-list-item in the fallback PUT', async () => {
        mockedPut.mockImplementationOnce((_, body) => Promise.resolve(body));

        await markConditionAsInactive(mockCondition);

        expect(mockedPut).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            category: expect.arrayContaining([
              expect.objectContaining({
                coding: expect.arrayContaining([
                  expect.objectContaining({ code: 'problem-list-item' }),
                ]),
              }),
            ]),
          }),
        );
      });

      it('should preserve all other fields from the original condition in the fallback PUT', async () => {
        mockedPut.mockImplementationOnce((_, body) => Promise.resolve(body));

        const result = await markConditionAsInactive(mockCondition);

        expect((result as typeof mockCondition).resourceType).toBe(
          mockCondition.resourceType,
        );
        expect((result as typeof mockCondition).id).toBe(mockCondition.id);
        expect((result as typeof mockCondition).code).toEqual(
          mockCondition.code,
        );
        expect((result as typeof mockCondition).subject).toEqual(
          mockCondition.subject,
        );
      });

      it('should propagate errors from the fallback PUT', async () => {
        const error = new Error('Network error');
        mockedPut.mockRejectedValueOnce(error);

        await expect(markConditionAsInactive(mockCondition)).rejects.toThrow(
          'Network error',
        );
      });
    });

    describe('matched=true — REUSE existing encounter (AC1)', () => {
      it('should POST an EncounterBundle (not a plain PUT) when matched=true', async () => {
        await markConditionAsInactive(mockCondition, mockActiveEncounter, true);

        expect(mockedPost).toHaveBeenCalledTimes(1);
        expect(mockedPost).toHaveBeenCalledWith(
          ENCOUNTER_BUNDLE_URL,
          expect.objectContaining({ resourceType: 'EncounterBundle' }),
        );
        expect(mockedPut).not.toHaveBeenCalled();
      });

      it('bundle should contain exactly 2 entries: PUT Encounter + PUT Condition', async () => {
        await markConditionAsInactive(mockCondition, mockActiveEncounter, true);

        const bundle = mockedPost.mock.calls[0][1] as {
          entry: Array<{
            fullUrl: string;
            resource: { resourceType: string };
            request: { method: string; url: string };
          }>;
        };
        expect(bundle.entry).toHaveLength(2);

        const [encounterEntry, conditionEntry] = bundle.entry;
        expect(encounterEntry.resource.resourceType).toBe('Encounter');
        expect(encounterEntry.request.method).toBe('PUT');
        expect(encounterEntry.request.url).toBe(
          `Encounter/${mockActiveEncounter.id}`,
        );
        expect(encounterEntry.fullUrl).toBe(
          `Encounter/${mockActiveEncounter.id}`,
        );

        expect(conditionEntry.resource.resourceType).toBe('Condition');
        expect(conditionEntry.request.method).toBe('PUT');
        expect(conditionEntry.request.url).toBe(
          `Condition/${mockCondition.id}`,
        );
      });

      it('condition entry should reference the existing encounter', async () => {
        await markConditionAsInactive(mockCondition, mockActiveEncounter, true);

        const bundle = mockedPost.mock.calls[0][1] as {
          entry: Array<{ resource: { encounter?: { reference: string } } }>;
        };
        const conditionEntry = bundle.entry[1];
        expect(conditionEntry.resource.encounter?.reference).toBe(
          `Encounter/${mockActiveEncounter.id}`,
        );
      });

      it('condition entry should have clinicalStatus inactive and category problem-list-item', async () => {
        await markConditionAsInactive(mockCondition, mockActiveEncounter, true);

        const bundle = mockedPost.mock.calls[0][1] as {
          entry: Array<{
            resource: {
              clinicalStatus?: { coding?: Array<{ code: string }> };
              category?: Array<{
                coding?: Array<{ code: string }>;
              }>;
            };
          }>;
        };
        const conditionResource = bundle.entry[1].resource;
        expect(conditionResource.clinicalStatus?.coding?.[0]?.code).toBe(
          'inactive',
        );
        expect(conditionResource.category?.[0]?.coding?.[0]?.code).toBe(
          'problem-list-item',
        );
      });
    });

    describe('matched=false with activeEncounter — CREATE NEW encounter (AC2)', () => {
      it('should POST an EncounterBundle (not a plain PUT) when matched=false and activeEncounter is present', async () => {
        await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          false,
        );

        expect(mockedPost).toHaveBeenCalledTimes(1);
        expect(mockedPost).toHaveBeenCalledWith(
          ENCOUNTER_BUNDLE_URL,
          expect.objectContaining({ resourceType: 'EncounterBundle' }),
        );
        expect(mockedPut).not.toHaveBeenCalled();
      });

      it('bundle should contain exactly 2 entries: POST Encounter + PUT Condition', async () => {
        await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          false,
        );

        const bundle = mockedPost.mock.calls[0][1] as {
          entry: Array<{
            fullUrl: string;
            resource: { resourceType: string; id?: string };
            request: { method: string; url: string };
          }>;
        };
        expect(bundle.entry).toHaveLength(2);

        const [encounterEntry, conditionEntry] = bundle.entry;
        expect(encounterEntry.resource.resourceType).toBe('Encounter');
        expect(encounterEntry.request.method).toBe('POST');
        // New encounter must NOT carry the old encounter's id
        expect(encounterEntry.resource.id).toBeUndefined();

        expect(conditionEntry.resource.resourceType).toBe('Condition');
        expect(conditionEntry.request.method).toBe('PUT');
      });

      it('new encounter entry should use a urn:uuid: placeholder as fullUrl', async () => {
        await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          false,
        );

        const bundle = mockedPost.mock.calls[0][1] as {
          entry: Array<{ fullUrl: string }>;
        };
        const encounterEntry = bundle.entry[0];
        expect(encounterEntry.fullUrl).toMatch(/^urn:uuid:/);
      });

      it('condition entry should reference the urn:uuid: placeholder', async () => {
        await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          false,
        );

        const bundle = mockedPost.mock.calls[0][1] as {
          entry: Array<{
            fullUrl: string;
            resource: { encounter?: { reference: string } };
          }>;
        };
        const [encounterEntry, conditionEntry] = bundle.entry;
        expect(conditionEntry.resource.encounter?.reference).toBe(
          encounterEntry.fullUrl,
        );
        expect(conditionEntry.resource.encounter?.reference).toMatch(
          /^urn:uuid:/,
        );
      });

      it('new encounter should reuse the type from the active encounter', async () => {
        await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          false,
        );

        const bundle = mockedPost.mock.calls[0][1] as {
          entry: Array<{
            resource: {
              type?: Array<{
                coding?: Array<{ code: string }>;
              }>;
            };
          }>;
        };
        const newEncounter = bundle.entry[0].resource;
        expect(newEncounter.type?.[0]?.coding?.[0]?.code).toBe('enc-type-uuid');
      });

      it('new encounter should reuse the partOf (visit) from the active encounter', async () => {
        await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          false,
        );

        const bundle = mockedPost.mock.calls[0][1] as {
          entry: Array<{
            resource: { partOf?: { reference: string } };
          }>;
        };
        const newEncounter = bundle.entry[0].resource;
        expect(newEncounter.partOf?.reference).toBe('Encounter/visit-uuid-999');
      });

      it('new encounter should use the login location for its location', async () => {
        await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          false,
        );

        const bundle = mockedPost.mock.calls[0][1] as {
          entry: Array<{
            resource: {
              location?: Array<{ location: { reference: string } }>;
            };
          }>;
        };
        const newEncounter = bundle.entry[0].resource;
        expect(newEncounter.location?.[0]?.location.reference).toBe(
          'Location/login-location-uuid',
        );
      });

      it('new encounter should have status finished and class AMB', async () => {
        await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          false,
        );

        const bundle = mockedPost.mock.calls[0][1] as {
          entry: Array<{
            resource: {
              status: string;
              class: { code: string };
            };
          }>;
        };
        const newEncounter = bundle.entry[0].resource;
        expect(newEncounter.status).toBe('finished');
        expect(newEncounter.class.code).toBe('AMB');
      });
    });
  });
});
