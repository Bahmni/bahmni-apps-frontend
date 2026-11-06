import { MedicationRequest as FhirMedicationRequest } from 'fhir/r4';
import { handleAction } from '../components/actionHandlers';
import {
  multipleActionsMock,
  singleActionMock,
} from './__mocks__/actionsMocks';
import { fhirMedicationRequestMock } from './__mocks__/medicationMocks';

describe('handleAction', () => {
  let dispatchSpy: jest.SpyInstance;

  beforeEach(() => {
    dispatchSpy = jest.spyOn(globalThis, 'dispatchEvent');
  });

  afterEach(() => {
    dispatchSpy.mockRestore();
  });

  it('dispatches startConsultation with context.basedOn for administer action', () => {
    handleAction(singleActionMock[0], fhirMedicationRequestMock);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'startConsultation',
        detail: expect.objectContaining({
          context: expect.objectContaining({
            encounterType: singleActionMock[0].encounterType,
            basedOn: fhirMedicationRequestMock,
          }),
          action: { type: 'create', resourceType: 'Immunization' },
        }),
      }),
    );
  });

  it('does not dispatch any event for unknown action types', () => {
    const unknownAction = {
      label: 'Unknown',
      type: 'unknown-action-type',
      encounterType: 'Consultation',
      requiredPrivilege: ['privilege1'],
    };

    handleAction(unknownAction, fhirMedicationRequestMock);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('dispatches edit event with action.resources and context.encounter', () => {
    const medWithEncounter: FhirMedicationRequest = {
      ...fhirMedicationRequestMock,
      encounter: { reference: 'Encounter/enc-uuid-1' },
    };
    const editAction = {
      label: 'Edit',
      type: 'edit' as const,
      encounterType: 'Consultation',
      requiredPrivilege: ['privilege1'],
    };

    handleAction(editAction, medWithEncounter);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'startConsultation',
        detail: expect.objectContaining({
          context: expect.objectContaining({
            encounter: { resourceType: 'Encounter', id: 'enc-uuid-1' },
          }),
          action: expect.objectContaining({
            type: 'update',
            resources: [medWithEncounter],
          }),
        }),
      }),
    );
  });

  it('handles missing encounter reference for edit action', () => {
    const editAction = {
      label: 'Edit',
      type: 'edit' as const,
      encounterType: 'Consultation',
      requiredPrivilege: ['privilege1'],
    };

    handleAction(editAction, fhirMedicationRequestMock);

    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.context.encounter).toBeUndefined();
  });

  it('does not dispatch edit event without fhirResource', () => {
    const editAction = {
      label: 'Edit',
      type: 'edit' as const,
      encounterType: 'Consultation',
      requiredPrivilege: ['privilege1'],
    };

    handleAction(editAction, undefined);

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  describe('stop action', () => {
    const stopAction = {
      label: 'Stop',
      type: 'stop' as const,
      encounterType: 'Consultation',
      requiredPrivilege: ['Stop Orders'],
    };

    it('dispatches startConsultation with context.encounterType and action.resources', () => {
      const medWithEncounter: FhirMedicationRequest = {
        ...fhirMedicationRequestMock,
        encounter: { reference: 'Encounter/enc-uuid-42' },
      };

      handleAction(stopAction, medWithEncounter);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'startConsultation',
          detail: expect.objectContaining({
            context: expect.objectContaining({
              encounterType: 'Consultation',
              encounter: { resourceType: 'Encounter', id: 'enc-uuid-42' },
            }),
            action: expect.objectContaining({
              type: 'delete',
              resources: [medWithEncounter],
            }),
          }),
        }),
      );
    });

    it('extracts encounter UUID from fhirResource.encounter.reference into context.encounter', () => {
      const medWithEncounter: FhirMedicationRequest = {
        ...fhirMedicationRequestMock,
        encounter: { reference: 'Encounter/my-encounter-uuid' },
      };

      handleAction(stopAction, medWithEncounter);

      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.context.encounter.id).toBe('my-encounter-uuid');
    });

    it('does not dispatch stop event without fhirResource', () => {
      handleAction(stopAction, undefined);

      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('context.encounter is undefined when no encounter reference on stop action', () => {
      handleAction(stopAction, fhirMedicationRequestMock);

      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.context.encounter).toBeUndefined();
    });
  });

  describe('cancel action', () => {
    const cancelAction = multipleActionsMock[1];

    it('dispatches startConsultation with context.encounterType and action.resources for cancelVaccination', () => {
      const medWithEncounter: FhirMedicationRequest = {
        ...fhirMedicationRequestMock,
        encounter: { reference: 'Encounter/enc-uuid-99' },
      };

      handleAction(cancelAction, medWithEncounter);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'startConsultation',
          detail: expect.objectContaining({
            context: expect.objectContaining({
              encounterType: cancelAction.encounterType,
              encounter: { resourceType: 'Encounter', id: 'enc-uuid-99' },
            }),
            action: expect.objectContaining({
              type: 'delete',
              resources: [medWithEncounter],
            }),
          }),
        }),
      );
    });

    it('extracts encounter UUID from fhirResource.encounter.reference into context.encounter', () => {
      const medWithEncounter: FhirMedicationRequest = {
        ...fhirMedicationRequestMock,
        encounter: { reference: 'Encounter/cancel-encounter-uuid' },
      };

      handleAction(cancelAction, medWithEncounter);

      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.context.encounter.id).toBe('cancel-encounter-uuid');
    });

    it('does not dispatch cancel event without fhirResource', () => {
      handleAction(cancelAction, undefined);

      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('context.encounter is undefined when no encounter reference on cancel action', () => {
      handleAction(cancelAction, fhirMedicationRequestMock);

      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.context.encounter).toBeUndefined();
    });
  });
});
