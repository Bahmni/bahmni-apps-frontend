import { Encounter } from 'fhir/r4';
import { get, post } from '../../api';
import { ENCOUNTER_BUNDLE_URL } from '../../encounterBundle';
import {
  createFhirEncounter,
  getEncounterTypeByName,
  getActiveVisit,
} from '../../encounterService';
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
jest.mock('../../encounterService');
jest.mock('../../utils/utils', () => ({
  ...jest.requireActual('../../utils/utils'),
  generateUUID: jest.fn(() => 'test-uuid-1234'),
}));

const mockedPost = post as jest.MockedFunction<typeof post>;
const mockedGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;
const mockedGetEncounterTypeByName =
  getEncounterTypeByName as jest.MockedFunction<typeof getEncounterTypeByName>;
const mockedGetActiveVisit = getActiveVisit as jest.MockedFunction<
  typeof getActiveVisit
>;
const mockedCreateFhirEncounter = createFhirEncounter as jest.MockedFunction<
  typeof createFhirEncounter
>;

const mockCreatedEncounter: Encounter = {
  resourceType: 'Encounter',
  id: 'created-enc-server-uuid',
  status: 'in-progress',
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
  },
};

const mockBundleResponse = {
  resourceType: 'Bundle',
  type: 'transaction-response',
  entry: [
    {
      response: {
        status: '200 OK',
        location: 'Encounter/mock-server-uuid/_history/1',
      },
    },
    {
      response: {
        status: '200 OK',
        location: 'Condition/cond-uuid/_history/1',
      },
    },
  ],
};

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
    mockedPost.mockResolvedValue(mockBundleResponse);
    mockedCreateFhirEncounter.mockResolvedValue(mockCreatedEncounter);
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
    describe('no encounter context — throws', () => {
      it('should throw when called with no activeEncounter and no encounterTypeName/patientUuid', async () => {
        await expect(markConditionAsInactive(mockCondition)).rejects.toThrow(
          'Unable to mark condition as inactive: no encounter context available',
        );
        expect(mockedPost).not.toHaveBeenCalled();
      });

      it('should throw when matched=true but activeEncounter has no id', async () => {
        const encounterWithoutId = { ...mockActiveEncounter, id: undefined };
        await expect(
          markConditionAsInactive(
            mockCondition,
            encounterWithoutId as any,
            true,
          ),
        ).rejects.toThrow(
          'Unable to mark condition as inactive: no encounter context available',
        );
        expect(mockedPost).not.toHaveBeenCalled();
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

      it('encounter entry should be rebuilt fresh (not the raw cached snapshot) with id grafted on', async () => {
        await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          true,
          undefined,
          undefined,
          'practitioner-uuid-ac1',
        );

        const bundle = mockedPost.mock.calls[0][1] as {
          entry: Array<{
            resource: {
              id?: string;
              location?: Array<{ location: { reference: string } }>;
              participant?: Array<{ individual?: { reference: string } }>;
            };
          }>;
        };
        const encounterResource = bundle.entry[0].resource;
        // id is grafted from the cached encounter
        expect(encounterResource.id).toBe(mockActiveEncounter.id);
        // location comes from the current login location, NOT from the cached snapshot
        expect(encounterResource.location?.[0]?.location.reference).toBe(
          'Location/login-location-uuid',
        );
        // participant is wired from the supplied practitionerUUID
        expect(encounterResource.participant?.[0]?.individual?.reference).toBe(
          'Practitioner/practitioner-uuid-ac1',
        );
      });

      it('should return the encounter with the existing id (AC1 reuses, no parse needed)', async () => {
        const result = await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          true,
        );

        expect(result.id).toBe(mockActiveEncounter.id);
      });

      it('should propagate POST failure (AC4)', async () => {
        mockedPost.mockRejectedValueOnce(new Error('Server error'));

        await expect(
          markConditionAsInactive(mockCondition, mockActiveEncounter, true),
        ).rejects.toThrow('Server error');
      });
    });

    describe('matched=false with activeEncounter — CREATE NEW encounter (AC2)', () => {
      it('should call createFhirEncounter then post a bundle when matched=false', async () => {
        await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          false,
        );

        expect(mockedCreateFhirEncounter).toHaveBeenCalledTimes(1);
        expect(mockedPost).toHaveBeenCalledTimes(1);
      });

      it('should build encounter reusing type, partOf and subject from active encounter', async () => {
        await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          false,
        );

        const enc = mockedCreateFhirEncounter.mock.calls[0][0];
        expect(enc.type?.[0]?.coding?.[0]?.code).toBe('enc-type-uuid');
        expect(enc.partOf?.reference).toBe('Encounter/visit-uuid-999');
        expect(enc.subject?.reference).toBe(
          mockActiveEncounter.subject?.reference,
        );
      });

      it('should build encounter with login location, in-progress status and AMB class', async () => {
        await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          false,
        );

        const enc = mockedCreateFhirEncounter.mock.calls[0][0];
        expect(enc.status).toBe('in-progress');
        expect(enc.class.code).toBe('AMB');
        expect(enc.location?.[0]?.location.reference).toBe(
          'Location/login-location-uuid',
        );
        expect(enc.period?.start).toBeDefined();
        expect(enc.period?.end).toBeUndefined();
      });

      it('should set participant when practitionerUUID is provided', async () => {
        await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          false,
          undefined,
          undefined,
          'practitioner-uuid-abc',
        );

        const enc = mockedCreateFhirEncounter.mock.calls[0][0];
        expect(enc.participant?.[0]?.individual?.reference).toBe(
          'Practitioner/practitioner-uuid-abc',
        );
      });

      it('should POST an EncounterBundle (PUT encounter + PUT condition) after createFhirEncounter', async () => {
        await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          false,
        );

        expect(mockedPost).toHaveBeenCalledWith(
          ENCOUNTER_BUNDLE_URL,
          expect.objectContaining({ resourceType: 'EncounterBundle' }),
        );
        const bundle = mockedPost.mock.calls[0][1] as {
          entry: Array<{
            fullUrl: string;
            resource: {
              resourceType: string;
              encounter?: { reference: string };
            };
            request: { method: string; url: string };
          }>;
        };
        expect(bundle.entry).toHaveLength(2);
        expect(bundle.entry[0].request.method).toBe('PUT');
        expect(bundle.entry[0].request.url).toBe(
          `Encounter/${mockCreatedEncounter.id}`,
        );
        expect(bundle.entry[1].request.method).toBe('PUT');
        expect(bundle.entry[1].resource.encounter?.reference).toBe(
          `Encounter/${mockCreatedEncounter.id}`,
        );
      });

      it('should return the encounter from createFhirEncounter (has server UUID)', async () => {
        const result = await markConditionAsInactive(
          mockCondition,
          mockActiveEncounter,
          false,
        );

        expect(result.id).toBe(mockCreatedEncounter.id);
      });

      it('should throw when login location is unavailable (AC4)', async () => {
        mockedGetUserLoginLocation.mockImplementation(() => {
          throw new Error('Login location cookie unavailable');
        });

        await expect(
          markConditionAsInactive(mockCondition, mockActiveEncounter, false),
        ).rejects.toThrow(
          'Unable to build encounter: login location unavailable',
        );
        expect(mockedCreateFhirEncounter).not.toHaveBeenCalled();
      });

      it('should propagate createFhirEncounter failure (AC4)', async () => {
        mockedCreateFhirEncounter.mockRejectedValueOnce(
          new Error('Server error'),
        );

        await expect(
          markConditionAsInactive(mockCondition, mockActiveEncounter, false),
        ).rejects.toThrow('Server error');
      });
    });

    describe('NO_ACTIVE_ENCOUNTER — fresh visit resolved via encounterTypeName+patientUuid', () => {
      const encounterTypeName = 'Consultation';
      const patientUuid = 'patient-uuid-xyz';
      const mockEncounterType = {
        uuid: 'enc-type-uuid-resolved',
        name: 'Consultation',
      };
      const mockActiveVisit: Encounter = {
        resourceType: 'Encounter',
        id: 'visit-uuid-fresh',
        status: 'in-progress',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
        },
      };

      beforeEach(() => {
        mockedGetEncounterTypeByName.mockResolvedValue(mockEncounterType);
        mockedGetActiveVisit.mockResolvedValue(mockActiveVisit);
      });

      it('should call createFhirEncounter then post a bundle when encounterType and visit resolve', async () => {
        await markConditionAsInactive(
          mockCondition,
          null,
          false,
          encounterTypeName,
          patientUuid,
        );

        expect(mockedGetEncounterTypeByName).toHaveBeenCalledWith(
          encounterTypeName,
        );
        expect(mockedGetActiveVisit).toHaveBeenCalledWith(patientUuid);
        expect(mockedCreateFhirEncounter).toHaveBeenCalledTimes(1);
        expect(mockedPost).toHaveBeenCalledTimes(1);
      });

      it('should build encounter using the resolved encounterType uuid and active visit as partOf', async () => {
        await markConditionAsInactive(
          mockCondition,
          null,
          false,
          encounterTypeName,
          patientUuid,
        );

        const enc = mockedCreateFhirEncounter.mock.calls[0][0];
        expect(enc.type?.[0]?.coding?.[0]?.code).toBe(mockEncounterType.uuid);
        expect(enc.partOf?.reference).toBe(`Encounter/${mockActiveVisit.id}`);
      });

      it('should POST an EncounterBundle (PUT encounter + PUT condition) after createFhirEncounter', async () => {
        await markConditionAsInactive(
          mockCondition,
          null,
          false,
          encounterTypeName,
          patientUuid,
        );

        expect(mockedPost).toHaveBeenCalledWith(
          ENCOUNTER_BUNDLE_URL,
          expect.objectContaining({ resourceType: 'EncounterBundle' }),
        );
        const bundle = mockedPost.mock.calls[0][1] as {
          entry: Array<{
            request: { method: string; url: string };
            resource: { encounter?: { reference: string } };
          }>;
        };
        expect(bundle.entry).toHaveLength(2);
        expect(bundle.entry[0].request.method).toBe('PUT');
        expect(bundle.entry[0].request.url).toBe(
          `Encounter/${mockCreatedEncounter.id}`,
        );
        expect(bundle.entry[1].request.method).toBe('PUT');
        expect(bundle.entry[1].resource.encounter?.reference).toBe(
          `Encounter/${mockCreatedEncounter.id}`,
        );
      });

      it('should return the encounter with the server UUID from createFhirEncounter', async () => {
        const result = await markConditionAsInactive(
          mockCondition,
          null,
          false,
          encounterTypeName,
          patientUuid,
        );

        expect(result.id).toBe(mockCreatedEncounter.id);
      });

      it('should throw when encounterType lookup returns null', async () => {
        mockedGetEncounterTypeByName.mockResolvedValueOnce(null);

        await expect(
          markConditionAsInactive(
            mockCondition,
            null,
            false,
            encounterTypeName,
            patientUuid,
          ),
        ).rejects.toThrow(
          'Unable to mark condition as inactive: no encounter context available',
        );
        expect(mockedCreateFhirEncounter).not.toHaveBeenCalled();
      });

      it('should throw when active visit lookup returns null', async () => {
        mockedGetActiveVisit.mockResolvedValueOnce(null);

        await expect(
          markConditionAsInactive(
            mockCondition,
            null,
            false,
            encounterTypeName,
            patientUuid,
          ),
        ).rejects.toThrow(
          'Unable to mark condition as inactive: no encounter context available',
        );
        expect(mockedCreateFhirEncounter).not.toHaveBeenCalled();
      });

      it('should propagate createFhirEncounter failure (AC4)', async () => {
        mockedCreateFhirEncounter.mockRejectedValueOnce(
          new Error('Server error'),
        );

        await expect(
          markConditionAsInactive(
            mockCondition,
            null,
            false,
            encounterTypeName,
            patientUuid,
          ),
        ).rejects.toThrow('Server error');
      });
    });
  });
});
