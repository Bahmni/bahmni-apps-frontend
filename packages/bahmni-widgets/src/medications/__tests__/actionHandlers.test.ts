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

  it('dispatches startConsultation with encounterType and basedOn for administer action', () => {
    handleAction(singleActionMock[0], fhirMedicationRequestMock);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'startConsultation',
        detail: {
          encounterType: singleActionMock[0].encounterType,
          basedOn: fhirMedicationRequestMock,
        },
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

  it('dispatches edit event with editMedications and encounter UUID', () => {
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
          encounterType: 'Consultation',
          editMedications: [medWithEncounter],
          editOnly: 'medication',
          editTitle: 'MEDICATIONS_EDIT_FORM_TITLE',
          editEncounterUuid: 'enc-uuid-1',
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
    expect(event.detail.editEncounterUuid).toBeUndefined();
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

    it('dispatches startConsultation with stopMedication and correct detail', () => {
      const medWithEncounter: FhirMedicationRequest = {
        ...fhirMedicationRequestMock,
        encounter: { reference: 'Encounter/enc-uuid-42' },
      };

      handleAction(stopAction, medWithEncounter);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'startConsultation',
          detail: expect.objectContaining({
            encounterType: 'Consultation',
            stopMedication: medWithEncounter,
            editOnly: 'stopMedications',
            editTitle: 'STOP_MEDICATION_FORM_TITLE',
            editEncounterUuid: 'enc-uuid-42',
          }),
        }),
      );
    });

    it('extracts encounter UUID from fhirResource.encounter.reference', () => {
      const medWithEncounter: FhirMedicationRequest = {
        ...fhirMedicationRequestMock,
        encounter: { reference: 'Encounter/my-encounter-uuid' },
      };

      handleAction(stopAction, medWithEncounter);

      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.editEncounterUuid).toBe('my-encounter-uuid');
    });

    it('does not dispatch stop event without fhirResource', () => {
      handleAction(stopAction, undefined);

      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('handles missing encounter reference for stop action', () => {
      handleAction(stopAction, fhirMedicationRequestMock);

      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.editEncounterUuid).toBeUndefined();
    });

    it('passes stopMedicationStartDate through to the dispatched detail', () => {
      handleAction(stopAction, fhirMedicationRequestMock, '2025-06-10');

      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.stopMedicationStartDate).toBe('2025-06-10');
    });
  });

  describe('cancel action', () => {
    // multipleActionsMock[1] === { label: 'Cancel', type: 'cancel', ... }
    const cancelAction = multipleActionsMock[1];

    it('dispatches startConsultation with stopMedication and correct detail for cancelVaccination', () => {
      const medWithEncounter: FhirMedicationRequest = {
        ...fhirMedicationRequestMock,
        encounter: { reference: 'Encounter/enc-uuid-99' },
      };

      handleAction(cancelAction, medWithEncounter);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'startConsultation',
          detail: expect.objectContaining({
            encounterType: cancelAction.encounterType,
            stopMedication: medWithEncounter,
            editOnly: 'cancelVaccination',
            editTitle: 'CANCEL_VACCINATION_FORM_TITLE',
            editEncounterUuid: 'enc-uuid-99',
          }),
        }),
      );
    });

    it('extracts encounter UUID from fhirResource.encounter.reference', () => {
      const medWithEncounter: FhirMedicationRequest = {
        ...fhirMedicationRequestMock,
        encounter: { reference: 'Encounter/cancel-encounter-uuid' },
      };

      handleAction(cancelAction, medWithEncounter);

      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.editEncounterUuid).toBe('cancel-encounter-uuid');
    });

    it('does not dispatch cancel event without fhirResource', () => {
      handleAction(cancelAction, undefined);

      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('handles missing encounter reference for cancel action', () => {
      handleAction(cancelAction, fhirMedicationRequestMock);

      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.editEncounterUuid).toBeUndefined();
    });

    it('passes stopMedicationStartDate through to the dispatched detail', () => {
      handleAction(cancelAction, fhirMedicationRequestMock, '2025-06-10');

      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.stopMedicationStartDate).toBe('2025-06-10');
    });
  });
});
