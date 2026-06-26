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
    handleAction(multipleActionsMock[1], undefined);
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
  });
});
