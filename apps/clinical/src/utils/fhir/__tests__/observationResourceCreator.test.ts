import { getFhirObservations } from '@bahmni/form2-controls';
import { Form2Observation } from '@bahmni/services';
import { Reference } from 'fhir/r4';
import {
  createObservationResources,
  createObservationEntriesWithVerbs,
} from '../observationResourceCreator';

jest.mock('@bahmni/form2-controls', () => ({
  getFhirObservations: jest.fn(),
}));

describe('observationResourceCreator', () => {
  const mockSubjectReference: Reference = {
    reference: 'Patient/patient-123',
  };

  const mockEncounterReference: Reference = {
    reference: 'Encounter/encounter-456',
  };

  const mockPerformerReference: Reference = {
    reference: 'Practitioner/practitioner-789',
  };

  const mockObservation: Form2Observation = {
    concept: {
      uuid: 'concept-uuid-1',
      datatype: 'Numeric',
    },
    value: 72,
    obsDatetime: '2025-01-15T10:30:00Z',
    formNamespace: 'Bahmni',
    formFieldPath: 'Vitals.1/1-0',
  };

  const mockFhirObservationResult = {
    resource: {
      resourceType: 'Observation' as const,
      id: 'obs-123',
      status: 'final' as const,
      code: {
        coding: [{ code: 'concept-uuid-1' }],
      },
      value: { value: 72 },
    },
    fullUrl: 'urn:uuid:obs-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Paths - Successful Observation Transformation', () => {
    it('should successfully transform observations to FHIR format', () => {
      (getFhirObservations as jest.Mock).mockReturnValue([
        mockFhirObservationResult,
      ]);

      const result = createObservationResources(
        [mockObservation],
        mockSubjectReference,
        mockEncounterReference,
        mockPerformerReference,
      );

      expect(result).toHaveLength(1);
      expect(result[0].resource.resourceType).toBe('Observation');
      expect(result[0].fullUrl).toBe('urn:uuid:obs-123');
      expect(result[0].resource.status).toBe('final');
    });

    it('should transform multiple observations correctly', () => {
      const mockObs2: Form2Observation = {
        concept: {
          uuid: 'concept-uuid-2',
          datatype: 'Numeric',
        },
        value: 98.6,
        obsDatetime: '2025-01-15T10:30:00Z',
        formNamespace: 'Bahmni',
        formFieldPath: 'Vitals.1/2-0',
      };

      const mockResult2 = {
        resource: {
          resourceType: 'Observation' as const,
          id: 'obs-124',
          status: 'final' as const,
          code: {
            coding: [{ code: 'concept-uuid-2' }],
          },
          value: { value: 98.6 },
        },
        fullUrl: 'urn:uuid:obs-124',
      };

      (getFhirObservations as jest.Mock).mockReturnValue([
        mockFhirObservationResult,
        mockResult2,
      ]);

      const result = createObservationResources(
        [mockObservation, mockObs2],
        mockSubjectReference,
        mockEncounterReference,
        mockPerformerReference,
      );

      expect(result).toHaveLength(2);
      expect(result[0].resource.id).toBe('obs-123');
      expect(result[1].resource.id).toBe('obs-124');
    });

    it('should handle grouped observations with hasMember references', () => {
      const parentObservation = {
        resource: {
          resourceType: 'Observation' as const,
          id: 'parent-obs',
          status: 'final' as const,
          code: { coding: [{ code: 'parent-uuid' }] },
          hasMember: [
            {
              reference: 'urn:uuid:child-obs-1',
              type: 'Observation',
            },
            {
              reference: 'urn:uuid:child-obs-2',
              type: 'Observation',
            },
          ],
        },
        fullUrl: 'urn:uuid:parent-obs',
      };

      const childObs1 = {
        resource: {
          resourceType: 'Observation' as const,
          id: 'child-obs-1',
          status: 'final' as const,
          code: { coding: [{ code: 'child-uuid-1' }] },
        },
        fullUrl: 'urn:uuid:child-obs-1',
      };

      const childObs2 = {
        resource: {
          resourceType: 'Observation' as const,
          id: 'child-obs-2',
          status: 'final' as const,
          code: { coding: [{ code: 'child-uuid-2' }] },
        },
        fullUrl: 'urn:uuid:child-obs-2',
      };

      (getFhirObservations as jest.Mock).mockReturnValue([
        childObs1,
        childObs2,
        parentObservation,
      ]);

      const groupedObs: Form2Observation = {
        concept: { uuid: 'parent-uuid' },
        value: null,
        groupMembers: [
          { concept: { uuid: 'child-uuid-1' }, value: 100 },
          { concept: { uuid: 'child-uuid-2' }, value: 200 },
        ],
      };

      const result = createObservationResources(
        [groupedObs],
        mockSubjectReference,
        mockEncounterReference,
        mockPerformerReference,
      );

      expect(result).toHaveLength(3);
      const parentResult = result.find(
        (r) => r.fullUrl === 'urn:uuid:parent-obs',
      )!;
      expect(parentResult.resource.hasMember).toHaveLength(2);
      expect((parentResult.resource.hasMember as any)[0].reference).toBe(
        'urn:uuid:child-obs-1',
      );
    });

    it('should return empty array when given empty observations', () => {
      (getFhirObservations as jest.Mock).mockReturnValue([]);

      const result = createObservationResources(
        [],
        mockSubjectReference,
        mockEncounterReference,
        mockPerformerReference,
      );

      expect(result).toEqual([]);
    });
  });

  describe('Error Handling - Library Exceptions', () => {
    it('should wrap and rethrow library errors with descriptive message', () => {
      const libError = new Error('Failed to transform observation format');
      (getFhirObservations as jest.Mock).mockImplementation(() => {
        throw libError;
      });

      expect(() =>
        createObservationResources(
          [mockObservation],
          mockSubjectReference,
          mockEncounterReference,
          mockPerformerReference,
        ),
      ).toThrow('Failed to transform observations to FHIR format');
    });

    it('should include original error message in thrown error', () => {
      const originalMessage = 'Invalid observation structure';
      const libError = new Error(originalMessage);
      (getFhirObservations as jest.Mock).mockImplementation(() => {
        throw libError;
      });

      expect(() =>
        createObservationResources(
          [mockObservation],
          mockSubjectReference,
          mockEncounterReference,
          mockPerformerReference,
        ),
      ).toThrow(originalMessage);
    });

    it('should handle non-Error objects thrown from library', () => {
      (getFhirObservations as jest.Mock).mockImplementation(() => {
        throw 'Unknown error occurred';
      });

      expect(() =>
        createObservationResources(
          [mockObservation],
          mockSubjectReference,
          mockEncounterReference,
          mockPerformerReference,
        ),
      ).toThrow('Unknown transformation error');
    });
  });

  describe('Library Contract Validation', () => {
    it('should call getFhirObservations with correct reference parameters', () => {
      (getFhirObservations as jest.Mock).mockReturnValue([
        mockFhirObservationResult,
      ]);

      createObservationResources(
        [mockObservation],
        mockSubjectReference,
        mockEncounterReference,
        mockPerformerReference,
      );

      expect(getFhirObservations).toHaveBeenCalledWith([mockObservation], {
        patientReference: mockSubjectReference,
        encounterReference: mockEncounterReference,
        performerReference: mockPerformerReference,
        basedOnReference: undefined,
      });
    });

    it('should return array with resource and fullUrl properties', () => {
      (getFhirObservations as jest.Mock).mockReturnValue([
        mockFhirObservationResult,
      ]);

      const result = createObservationResources(
        [mockObservation],
        mockSubjectReference,
        mockEncounterReference,
        mockPerformerReference,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('resource');
      expect(result[0]).toHaveProperty('fullUrl');
      expect(result[0].resource.resourceType).toBe('Observation');
      expect(typeof result[0].fullUrl).toBe('string');
    });
  });

  describe('BasedOn Reference Handling', () => {
    const mockBasedOnReference: Reference = {
      reference: 'ServiceRequest/service-request-123',
    };

    it('should call getFhirObservations with basedOnReference when provided', () => {
      (getFhirObservations as jest.Mock).mockReturnValue([
        mockFhirObservationResult,
      ]);

      createObservationResources(
        [mockObservation],
        mockSubjectReference,
        mockEncounterReference,
        mockPerformerReference,
        mockBasedOnReference,
      );

      expect(getFhirObservations).toHaveBeenCalledWith([mockObservation], {
        patientReference: mockSubjectReference,
        encounterReference: mockEncounterReference,
        performerReference: mockPerformerReference,
        basedOnReference: mockBasedOnReference,
      });
    });

    it('should pass undefined basedOnReference when not provided', () => {
      (getFhirObservations as jest.Mock).mockReturnValue([
        mockFhirObservationResult,
      ]);

      createObservationResources(
        [mockObservation],
        mockSubjectReference,
        mockEncounterReference,
        mockPerformerReference,
      );

      expect(getFhirObservations).toHaveBeenCalledWith([mockObservation], {
        patientReference: mockSubjectReference,
        encounterReference: mockEncounterReference,
        performerReference: mockPerformerReference,
        basedOnReference: undefined,
      });
    });

    it('should pass all references correctly to getFhirObservations when basedOn exists', () => {
      (getFhirObservations as jest.Mock).mockReturnValue([
        mockFhirObservationResult,
      ]);

      createObservationResources(
        [mockObservation],
        mockSubjectReference,
        mockEncounterReference,
        mockPerformerReference,
        mockBasedOnReference,
      );

      expect(getFhirObservations).toHaveBeenCalledTimes(1);
      const callArgs = (getFhirObservations as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toEqual([mockObservation]);
      expect(callArgs[1].patientReference).toEqual(mockSubjectReference);
      expect(callArgs[1].encounterReference).toEqual(mockEncounterReference);
      expect(callArgs[1].performerReference).toEqual(mockPerformerReference);
      expect(callArgs[1].basedOnReference).toEqual(mockBasedOnReference);
    });

    it('should return observation entries when basedOn reference is provided', () => {
      const obsWithBasedOn = {
        resource: {
          ...mockFhirObservationResult.resource,
          basedOn: [mockBasedOnReference],
        },
        fullUrl: 'urn:uuid:obs-with-basedon',
      };

      (getFhirObservations as jest.Mock).mockReturnValue([obsWithBasedOn]);

      const result = createObservationResources(
        [mockObservation],
        mockSubjectReference,
        mockEncounterReference,
        mockPerformerReference,
        mockBasedOnReference,
      );

      expect(result).toHaveLength(1);
      expect(result[0].fullUrl).toBe('urn:uuid:obs-with-basedon');
      expect((result[0].resource as any).basedOn).toEqual([
        mockBasedOnReference,
      ]);
    });

    it('should handle errors and include basedOn context in error message', () => {
      const libError = new Error('Invalid basedOn reference');
      (getFhirObservations as jest.Mock).mockImplementation(() => {
        throw libError;
      });

      expect(() =>
        createObservationResources(
          [mockObservation],
          mockSubjectReference,
          mockEncounterReference,
          mockPerformerReference,
          mockBasedOnReference,
        ),
      ).toThrow('Failed to transform observations to FHIR format');
      expect(() =>
        createObservationResources(
          [mockObservation],
          mockSubjectReference,
          mockEncounterReference,
          mockPerformerReference,
          mockBasedOnReference,
        ),
      ).toThrow('Invalid basedOn reference');
    });

    it.each([
      ['with basedOn', mockBasedOnReference, mockBasedOnReference],
      ['without basedOn', undefined, undefined],
    ])(
      'should correctly handle %s reference',
      (_, basedOn, expectedBasedOnRef) => {
        (getFhirObservations as jest.Mock).mockReturnValue([
          mockFhirObservationResult,
        ]);

        createObservationResources(
          [mockObservation],
          mockSubjectReference,
          mockEncounterReference,
          mockPerformerReference,
          basedOn,
        );

        expect(getFhirObservations).toHaveBeenCalledWith([mockObservation], {
          patientReference: mockSubjectReference,
          encounterReference: mockEncounterReference,
          performerReference: mockPerformerReference,
          basedOnReference: expectedBasedOnRef,
        });
      },
    );
  });
});

describe('createObservationEntriesWithVerbs', () => {
  const subject: Reference = { reference: 'Patient/patient-1' };
  const encounter: Reference = { reference: 'Encounter/encounter-1' };
  const performer: Reference = { reference: 'Practitioner/practitioner-1' };

  const mockEntry = (fullUrl = 'urn:uuid:new-obs') => ({
    resource: {
      resourceType: 'Observation' as const,
      status: 'final' as const,
      code: { coding: [{ code: 'concept-1' }] },
    },
    fullUrl,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (getFhirObservations as jest.Mock).mockReturnValue([mockEntry()]);
  });

  describe('leaf observations', () => {
    it('emits POST for a new observation (no uuid)', () => {
      const obs: Form2Observation = {
        concept: { uuid: 'concept-1' },
        value: 42,
      };
      const entries = createObservationEntriesWithVerbs(
        [obs],
        subject,
        encounter,
        performer,
      );

      expect(entries).toHaveLength(1);
      expect(entries[0].request?.method).toBe('POST');
      expect(entries[0].fullUrl).toMatch(/^urn:uuid:/);
    });

    it('emits PUT for an existing observation (uuid present, not voided)', () => {
      const obs: Form2Observation = {
        concept: { uuid: 'concept-1' },
        value: 42,
        uuid: 'existing-obs-uuid',
        status: 'final',
      };
      const entries = createObservationEntriesWithVerbs(
        [obs],
        subject,
        encounter,
        performer,
      );

      expect(entries).toHaveLength(1);
      expect(entries[0].request?.method).toBe('PUT');
      expect(entries[0].request?.url).toBe('Observation/existing-obs-uuid');
      expect(entries[0].fullUrl).toBe('Observation/existing-obs-uuid');
    });

    it('emits DELETE for a voided existing observation', () => {
      const obs: Form2Observation = {
        concept: { uuid: 'concept-1' },
        value: null,
        uuid: 'obs-to-delete',
        voided: true,
      };
      const entries = createObservationEntriesWithVerbs(
        [obs],
        subject,
        encounter,
        performer,
      );

      expect(entries).toHaveLength(1);
      expect(entries[0].request?.method).toBe('DELETE');
      expect(entries[0].request?.url).toBe('Observation/obs-to-delete');
      expect(entries[0].resource).toMatchObject({
        resourceType: 'Observation',
        id: 'obs-to-delete',
      });
    });

    it('skips observations with no uuid and no value (empty addMore slots)', () => {
      const obs: Form2Observation = {
        concept: { uuid: 'concept-1' },
        value: null,
      };
      const entries = createObservationEntriesWithVerbs(
        [obs],
        subject,
        encounter,
        performer,
      );

      expect(entries).toHaveLength(0);
    });

    it('echoes the preserved status onto the PUT resource so OpenMRS does not reject it', () => {
      const obs: Form2Observation = {
        concept: { uuid: 'concept-1' },
        value: 42,
        uuid: 'obs-uuid',
        status: 'amended',
      };
      (getFhirObservations as jest.Mock).mockReturnValue([
        mockEntry('Observation/obs-uuid'),
      ]);

      const entries = createObservationEntriesWithVerbs(
        [obs],
        subject,
        encounter,
        performer,
      );

      expect(entries[0].request?.method).toBe('PUT');
      // obs.status ('amended') must be echoed back so OpenMRS sees the same
      // value it already has and does not raise "Editing status not allowed".
      expect((entries[0].resource as Record<string, unknown>).status).toBe(
        'amended',
      );
    });

    it('returns empty array for empty input', () => {
      const entries = createObservationEntriesWithVerbs(
        [],
        subject,
        encounter,
        performer,
      );
      expect(entries).toHaveLength(0);
    });
  });

  describe('grouped observations (obsGroup)', () => {
    it('emits POST for a new parent obsGroup (no uuid)', () => {
      const groupObs: Form2Observation = {
        concept: { uuid: 'group-concept' },
        value: null,
        groupMembers: [{ concept: { uuid: 'child-concept' }, value: 10 }],
      };
      (getFhirObservations as jest.Mock).mockReturnValue([mockEntry()]);

      const entries = createObservationEntriesWithVerbs(
        [groupObs],
        subject,
        encounter,
        performer,
      );

      const parentEntry = entries.find((e) => e.request?.method === 'POST');
      expect(parentEntry).toBeDefined();
    });

    it('emits POST (with existing uuid) for parent obsGroup with remaining children', () => {
      const groupObs: Form2Observation = {
        concept: { uuid: 'group-concept' },
        value: null,
        uuid: 'parent-obs-uuid',
        status: 'final',
        groupMembers: [{ concept: { uuid: 'child-concept' }, value: 10 }],
      };
      (getFhirObservations as jest.Mock).mockReturnValue([
        mockEntry('Observation/parent-obs-uuid'),
      ]);

      const entries = createObservationEntriesWithVerbs(
        [groupObs],
        subject,
        encounter,
        performer,
      );

      const parentEntry = entries.find(
        (e) => e.fullUrl === 'Observation/parent-obs-uuid',
      );
      expect(parentEntry).toBeDefined();
      expect(parentEntry?.request?.method).toBe('POST');
      expect(parentEntry?.request?.url).toBe('Observation');
      expect((parentEntry?.resource as Record<string, unknown>).id).toBe(
        'parent-obs-uuid',
      );
    });

    it('emits DELETE for parent obsGroup when all children are removed', () => {
      const groupObs: Form2Observation = {
        concept: { uuid: 'group-concept' },
        value: null,
        uuid: 'parent-obs-uuid',
        groupMembers: [
          {
            concept: { uuid: 'child-concept' },
            value: null,
            uuid: 'child-uuid',
            voided: true,
          },
        ],
      };

      const entries = createObservationEntriesWithVerbs(
        [groupObs],
        subject,
        encounter,
        performer,
      );

      const deleteEntry = entries.find(
        (e) => e.request?.url === 'Observation/parent-obs-uuid',
      );
      expect(deleteEntry?.request?.method).toBe('DELETE');
    });
  });
});
