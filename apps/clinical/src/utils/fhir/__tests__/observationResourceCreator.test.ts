import { getFhirObservations } from '@bahmni/form2-controls';
import { Form2Observation } from '@bahmni/services';
import { Reference } from 'fhir/r4';
import { createObservationEntries } from '../observationResourceCreator';

jest.mock('@bahmni/form2-controls', () => ({
  getFhirObservations: jest.fn(),
}));

describe('createObservationEntries', () => {
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
      const entries = createObservationEntries(
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
      const entries = createObservationEntries(
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
      const entries = createObservationEntries(
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
      const entries = createObservationEntries(
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

      const entries = createObservationEntries(
        [obs],
        subject,
        encounter,
        performer,
      );

      expect(entries[0].request?.method).toBe('PUT');
      // obs.status must be echoed back so OpenMRS doesn't raise "Editing status not allowed".
      expect((entries[0].resource as Record<string, unknown>).status).toBe(
        'amended',
      );
    });

    it('echoes the preserved basedOn onto the PUT resource', () => {
      const obsBasedOn = { reference: 'ServiceRequest/sr-original' };
      const obs: Form2Observation = {
        concept: { uuid: 'concept-1' },
        value: 42,
        uuid: 'obs-uuid',
        status: 'amended',
        basedOn: obsBasedOn,
      };
      (getFhirObservations as jest.Mock).mockReturnValue([
        mockEntry('Observation/obs-uuid'),
      ]);

      const entries = createObservationEntries(
        [obs],
        subject,
        encounter,
        performer,
      );

      expect(entries[0].request?.method).toBe('PUT');
      expect(
        (entries[0].resource as { basedOn?: Reference[] }).basedOn,
      ).toEqual([obsBasedOn]);
    });

    it('returns empty array for empty input', () => {
      const entries = createObservationEntries(
        [],
        subject,
        encounter,
        performer,
      );
      expect(entries).toHaveLength(0);
    });

    it('skips a new observation when getFhirObservations returns no entry', () => {
      (getFhirObservations as jest.Mock).mockReturnValue([]);
      const obs: Form2Observation = {
        concept: { uuid: 'concept-1' },
        value: 42,
      };
      const entries = createObservationEntries(
        [obs],
        subject,
        encounter,
        performer,
      );
      expect(entries).toHaveLength(0);
    });

    it('skips an existing observation when getFhirObservations returns no entry', () => {
      (getFhirObservations as jest.Mock).mockReturnValue([]);
      const obs: Form2Observation = {
        concept: { uuid: 'concept-1' },
        value: 42,
        uuid: 'existing-obs-uuid',
      };
      const entries = createObservationEntries(
        [obs],
        subject,
        encounter,
        performer,
      );
      expect(entries).toHaveLength(0);
    });

    it('skips a never-saved voided observation (no uuid + voided)', () => {
      const obs: Form2Observation = {
        concept: { uuid: 'concept-1' },
        value: null,
        voided: true,
      };
      const entries = createObservationEntries(
        [obs],
        subject,
        encounter,
        performer,
      );
      expect(entries).toHaveLength(0);
    });

    it('skips an existing observation marked unchanged (no dateChanged churn for untouched fields)', () => {
      const obs: Form2Observation = {
        concept: { uuid: 'concept-1' },
        value: 42,
        uuid: 'existing-obs-uuid',
        unchanged: true,
      };
      const entries = createObservationEntries(
        [obs],
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

      const entries = createObservationEntries(
        [groupObs],
        subject,
        encounter,
        performer,
      );

      const parentEntry = entries.find((e) => e.request?.method === 'POST');
      expect(parentEntry).toBeDefined();
    });

    it('emits PUT (at existing uuid) for parent obsGroup with remaining children', () => {
      const groupObs: Form2Observation = {
        concept: { uuid: 'group-concept' },
        value: null,
        uuid: 'parent-obs-uuid',
        status: 'final',
        groupMembers: [{ concept: { uuid: 'child-concept' }, value: 10 }],
      };
      (getFhirObservations as jest.Mock)
        .mockReturnValueOnce([mockEntry('urn:uuid:child')]) // child POST
        .mockReturnValueOnce([mockEntry('Observation/parent-obs-uuid')]); // parent PUT

      const entries = createObservationEntries(
        [groupObs],
        subject,
        encounter,
        performer,
      );

      const parentEntry = entries.find(
        (e) => e.fullUrl === 'Observation/parent-obs-uuid',
      );
      expect(parentEntry).toBeDefined();
      expect(parentEntry?.request?.method).toBe('PUT');
      expect(parentEntry?.request?.url).toBe('Observation/parent-obs-uuid');
      expect((parentEntry?.resource as Record<string, unknown>).id).toBe(
        'parent-obs-uuid',
      );
    });

    it('echoes the preserved basedOn onto the parent obsGroup PUT resource', () => {
      const parentBasedOn = { reference: 'ServiceRequest/sr-parent' };
      const groupObs: Form2Observation = {
        concept: { uuid: 'group-concept' },
        value: null,
        uuid: 'parent-obs-uuid',
        status: 'final',
        basedOn: parentBasedOn,
        groupMembers: [{ concept: { uuid: 'child-concept' }, value: 10 }],
      };
      (getFhirObservations as jest.Mock)
        .mockReturnValueOnce([mockEntry('urn:uuid:child')])
        .mockReturnValueOnce([mockEntry('Observation/parent-obs-uuid')]);

      const entries = createObservationEntries(
        [groupObs],
        subject,
        encounter,
        performer,
      );

      const parentEntry = entries.find(
        (e) => e.fullUrl === 'Observation/parent-obs-uuid',
      );
      expect(
        (parentEntry?.resource as { basedOn?: Reference[] }).basedOn,
      ).toEqual([parentBasedOn]);
    });

    it('skips new parent obsGroup when getFhirObservations returns no entry for parent', () => {
      // Child succeeds but the subsequent parent POST call returns nothing → parent is skipped.
      (getFhirObservations as jest.Mock)
        .mockReturnValueOnce([mockEntry('urn:uuid:child')]) // child POST
        .mockReturnValueOnce([]); // parent POST returns nothing
      const groupObs: Form2Observation = {
        concept: { uuid: 'group-concept' },
        value: null,
        groupMembers: [{ concept: { uuid: 'child-concept' }, value: 10 }],
      };
      const entries = createObservationEntries(
        [groupObs],
        subject,
        encounter,
        performer,
      );
      // Child entry is added but parent is skipped
      expect(entries).toHaveLength(1);
      expect(entries[0].fullUrl).toBe('urn:uuid:child');
    });

    it('skips existing parent obsGroup when getFhirObservations returns no entry for the parent', () => {
      // Child succeeds but the subsequent parent PUT call returns nothing → parent is skipped.
      (getFhirObservations as jest.Mock)
        .mockReturnValueOnce([mockEntry('urn:uuid:child')]) // child POST
        .mockReturnValueOnce([]); // parent PUT returns nothing
      const groupObs: Form2Observation = {
        concept: { uuid: 'group-concept' },
        value: null,
        uuid: 'parent-uuid',
        groupMembers: [{ concept: { uuid: 'child-concept' }, value: 10 }],
      };
      const entries = createObservationEntries(
        [groupObs],
        subject,
        encounter,
        performer,
      );
      // Child entry is added but parent entry is skipped (returns null)
      expect(entries).toHaveLength(1);
      expect(entries[0].fullUrl).toBe('urn:uuid:child');
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

      const entries = createObservationEntries(
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

    it('does not touch the parent when one member is removed and the rest are unchanged (only the removed child gets a DELETE)', () => {
      // Regression: OpenMRS rejects a PUT to a group parent with empty hasMember ("error.noValue").
      const groupObs: Form2Observation = {
        concept: { uuid: 'group-concept' },
        value: null,
        uuid: 'parent-obs-uuid',
        groupMembers: [
          {
            concept: { uuid: 'removed-child-concept' },
            value: null,
            uuid: 'removed-child-uuid',
            voided: true,
          },
          {
            concept: { uuid: 'unchanged-child-concept' },
            value: 3,
            uuid: 'unchanged-child-uuid',
            unchanged: true,
          },
        ],
      };

      const entries = createObservationEntries(
        [groupObs],
        subject,
        encounter,
        performer,
      );

      // Only the removed child's DELETE — no entry at all for the parent.
      expect(entries).toHaveLength(1);
      expect(entries[0].fullUrl).toBe('Observation/removed-child-uuid');
      expect(entries[0].request?.method).toBe('DELETE');
      expect(
        entries.some((e) => e.fullUrl === 'Observation/parent-obs-uuid'),
      ).toBe(false);
    });

    it('omits unchanged children from hasMember and does not PUT them, but still updates the parent for the changed sibling', () => {
      const groupObs: Form2Observation = {
        concept: { uuid: 'group-concept' },
        value: null,
        uuid: 'parent-obs-uuid',
        groupMembers: [
          {
            concept: { uuid: 'unchanged-child-concept' },
            value: 2,
            uuid: 'unchanged-child-uuid',
            unchanged: true,
          },
          {
            concept: { uuid: 'changed-child-concept' },
            value: 6,
            uuid: 'changed-child-uuid',
          },
        ],
      };
      (getFhirObservations as jest.Mock).mockReturnValue([
        mockEntry('Observation/changed-child-uuid'),
      ]);

      const entries = createObservationEntries(
        [groupObs],
        subject,
        encounter,
        performer,
      );

      // Only the changed child + the parent update — nothing for the unchanged sibling.
      expect(entries).toHaveLength(2);
      const childEntry = entries.find(
        (e) => e.fullUrl === 'Observation/changed-child-uuid',
      );
      expect(childEntry?.request?.method).toBe('PUT');

      const parentEntry = entries.find(
        (e) => e.fullUrl === 'Observation/parent-obs-uuid',
      );
      expect(parentEntry?.request?.method).toBe('PUT');
      const hasMember = (
        parentEntry?.resource as unknown as {
          hasMember: { reference: string }[];
        }
      ).hasMember;
      expect(hasMember).toEqual([
        { reference: 'Observation/changed-child-uuid' },
      ]);
    });

    it('skips the entire group (parent + all children) when every member is unchanged', () => {
      const groupObs: Form2Observation = {
        concept: { uuid: 'group-concept' },
        value: null,
        uuid: 'parent-obs-uuid',
        groupMembers: [
          {
            concept: { uuid: 'child-a-concept' },
            value: 2,
            uuid: 'child-a-uuid',
            unchanged: true,
          },
          {
            concept: { uuid: 'child-b-concept' },
            value: 3,
            uuid: 'child-b-uuid',
            unchanged: true,
          },
        ],
      };

      const entries = createObservationEntries(
        [groupObs],
        subject,
        encounter,
        performer,
      );

      expect(entries).toHaveLength(0);
    });
  });
});
