import { MedicationRequest as FhirMedicationRequest } from 'fhir/r4';
import { handleAction, handleEditAction } from '../components/actionHandlers';
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

  it('routes to handleEditAction for edit type', () => {
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
        }),
      }),
    );
  });
});

describe('handleEditAction', () => {
  let dispatchSpy: jest.SpyInstance;

  beforeEach(() => {
    dispatchSpy = jest.spyOn(globalThis, 'dispatchEvent');
  });

  afterEach(() => {
    dispatchSpy.mockRestore();
  });

  it('dispatches startConsultation event with correct detail', () => {
    const medications: FhirMedicationRequest[] = [
      {
        ...fhirMedicationRequestMock,
        encounter: { reference: 'Encounter/enc-uuid-1' },
      },
    ];

    handleEditAction(medications, 'Consultation');

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'startConsultation',
        detail: {
          encounterType: 'Consultation',
          editMedications: medications,
          editOnly: 'medication',
          editTitle: 'MEDICATIONS_EDIT_FORM_TITLE',
          editEncounterUuid: 'enc-uuid-1',
        },
      }),
    );
  });

  it('extracts encounter UUID from first medication reference', () => {
    const medications: FhirMedicationRequest[] = [
      {
        ...fhirMedicationRequestMock,
        encounter: { reference: 'Encounter/first-enc-uuid' },
      },
      {
        ...fhirMedicationRequestMock,
        encounter: { reference: 'Encounter/second-enc-uuid' },
      },
    ];

    handleEditAction(medications, 'Consultation');

    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.editEncounterUuid).toBe('first-enc-uuid');
  });

  it('handles missing encounter reference', () => {
    const medications: FhirMedicationRequest[] = [
      { ...fhirMedicationRequestMock },
    ];

    handleEditAction(medications, 'Consultation');

    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.editEncounterUuid).toBeUndefined();
  });

  it('uses MEDICATIONS_INPUT_CONTROL_KEY for editOnly', () => {
    const medications: FhirMedicationRequest[] = [
      { ...fhirMedicationRequestMock },
    ];

    handleEditAction(medications, 'Consultation');

    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.editOnly).toBe('medication');
  });
});
