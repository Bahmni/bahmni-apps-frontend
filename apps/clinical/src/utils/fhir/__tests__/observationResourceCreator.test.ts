import { getFhirObservations } from '@bahmni/form2-controls';
import { Form2Observation } from '@bahmni/services';
import { Reference } from 'fhir/r4';
import { createObservationResources } from '../observationResourceCreator';

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
});
