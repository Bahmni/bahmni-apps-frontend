import { dispatchAuditEvent } from '@bahmni/services';
import { createStopMedicationEntry } from '../../../../services/stopMedicationService';
import { useStopMedicationStore } from '../../../../stores/stopMedicationsStore';
import { getRegisteredInputControls } from '../../registry';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchAuditEvent: jest.fn(),
}));

jest.mock('../../../../services/stopMedicationService', () => ({
  createStopMedicationEntry: jest.fn(),
}));

jest.mock('../StopMedicationForm', () => () => null);

const mockDispatchAuditEvent = dispatchAuditEvent as jest.MockedFunction<
  typeof dispatchAuditEvent
>;

describe('stopMedications input control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStopMedicationStore.getState().reset();
  });

  beforeAll(async () => {
    await import('../index');
  });

  function getStopMedicationsControl() {
    const controls = getRegisteredInputControls();
    return controls.find((c) => c.key === 'stopMedications');
  }

  it('should register with key "stopMedications"', () => {
    const control = getStopMedicationsControl();
    expect(control).toBeDefined();
    expect(control!.key).toBe('stopMedications');
  });

  it('reset() calls store reset', () => {
    getStopMedicationsControl()!.reset();
    const state = useStopMedicationStore.getState();
    expect(state.medicationToStop).toBeNull();
    expect(state.stopReason).toBeNull();
    expect(state.note).toBe('');
  });

  it('validate() returns true when no medication set', () => {
    expect(getStopMedicationsControl()!.validate()).toBe(true);
  });

  it('validate() returns false when mandatory fields are missing', () => {
    useStopMedicationStore.getState().setMedicationToStop({
      resourceType: 'MedicationRequest',
      id: 'med-1',
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/p-1' },
    });
    expect(getStopMedicationsControl()!.validate()).toBe(false);
  });

  it('validate() sets STOP_MEDICATION_*_REQUIRED error keys', () => {
    const store = useStopMedicationStore.getState();
    store.setMedicationToStop({
      resourceType: 'MedicationRequest',
      id: 'med-1',
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/p-1' },
    });
    store.setStopDate(null as unknown as Date);

    getStopMedicationsControl()!.validate();

    const { errors } = useStopMedicationStore.getState();
    expect(errors.stopDate).toBe('STOP_MEDICATION_DATE_REQUIRED');
    expect(errors.stopReason).toBe('STOP_MEDICATION_REASON_REQUIRED');
  });

  it('hasData() returns true when medicationToStop is set', () => {
    useStopMedicationStore.getState().setMedicationToStop({
      resourceType: 'MedicationRequest',
      id: 'med-1',
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/p-1' },
    });
    expect(getStopMedicationsControl()!.hasData()).toBe(true);
  });

  it('hasData() returns false when medicationToStop is null', () => {
    expect(getStopMedicationsControl()!.hasData()).toBe(false);
  });

  it('createBundleEntries is wired directly to createStopMedicationEntry', () => {
    expect(getStopMedicationsControl()!.createBundleEntries).toBe(
      createStopMedicationEntry,
    );
  });

  it('onSubmitSuccess dispatches a STOP_MEDICATION audit event for the submitted patient', () => {
    getStopMedicationsControl()!.onSubmitSuccess!({
      patientUUID: 'patient-1',
      encounterTypeName: 'Consultation',
      updatedConcepts: new Map(),
    });

    expect(mockDispatchAuditEvent).toHaveBeenCalledTimes(1);
    expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
      eventType: 'STOP_MEDICATION',
      patientUuid: 'patient-1',
      messageParams: {},
    });
  });
});

describe('cancelVaccination input control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStopMedicationStore.getState().reset();
  });

  beforeAll(async () => {
    await import('../index');
  });

  function getCancelVaccinationControl() {
    const controls = getRegisteredInputControls();
    return controls.find((c) => c.key === 'cancelVaccination');
  }

  it('should register with key "cancelVaccination"', () => {
    const control = getCancelVaccinationControl();
    expect(control).toBeDefined();
    expect(control!.key).toBe('cancelVaccination');
  });

  it('reuses the StopMedicationForm component also used by the "stopMedications" entry', () => {
    const controls = getRegisteredInputControls();
    const stopMedicationsControl = controls.find(
      (c) => c.key === 'stopMedications',
    );
    const cancelVaccinationControl = getCancelVaccinationControl();
    expect(cancelVaccinationControl!.component).toBe(
      stopMedicationsControl!.component,
    );
  });

  it('reset() calls the shared store reset', () => {
    getCancelVaccinationControl()!.reset();
    const state = useStopMedicationStore.getState();
    expect(state.medicationToStop).toBeNull();
    expect(state.stopReason).toBeNull();
    expect(state.note).toBe('');
  });

  it('validate() returns true when no medication set', () => {
    expect(getCancelVaccinationControl()!.validate()).toBe(true);
  });

  it('validate() returns false when mandatory fields are missing', () => {
    useStopMedicationStore.getState().setMedicationToStop({
      resourceType: 'MedicationRequest',
      id: 'med-1',
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/p-1' },
    });
    expect(getCancelVaccinationControl()!.validate()).toBe(false);
  });

  it('validate() sets CANCEL_VACCINATION_REASON_REQUIRED, not STOP_MEDICATION_REASON_REQUIRED', () => {
    const store = useStopMedicationStore.getState();
    store.setMedicationToStop({
      resourceType: 'MedicationRequest',
      id: 'med-1',
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/p-1' },
    });
    store.setInputControlKey('cancelVaccination');

    getCancelVaccinationControl()!.validate();

    const { errors } = useStopMedicationStore.getState();
    expect(errors.stopReason).toBe('CANCEL_VACCINATION_REASON_REQUIRED');
  });

  it('hasData() returns true when medicationToStop is set', () => {
    useStopMedicationStore.getState().setMedicationToStop({
      resourceType: 'MedicationRequest',
      id: 'med-1',
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/p-1' },
    });
    expect(getCancelVaccinationControl()!.hasData()).toBe(true);
  });

  it('hasData() returns false when medicationToStop is null', () => {
    expect(getCancelVaccinationControl()!.hasData()).toBe(false);
  });

  it('createBundleEntries is wired directly to createStopMedicationEntry', () => {
    expect(getCancelVaccinationControl()!.createBundleEntries).toBe(
      createStopMedicationEntry,
    );
  });

  it('shares the same underlying store state as the "stopMedications" entry', () => {
    const controls = getRegisteredInputControls();
    const stopMedicationsControl = controls.find(
      (c) => c.key === 'stopMedications',
    );
    const cancelVaccinationControl = getCancelVaccinationControl();

    useStopMedicationStore.getState().setMedicationToStop({
      resourceType: 'MedicationRequest',
      id: 'shared-med-1',
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/p-1' },
    });

    // Both entries read/write the same Zustand store, so hasData() agrees.
    expect(cancelVaccinationControl!.hasData()).toBe(true);
    expect(stopMedicationsControl!.hasData()).toBe(true);
  });

  it('onSubmitSuccess dispatches a STOP_MEDICATION audit event for the submitted patient', () => {
    getCancelVaccinationControl()!.onSubmitSuccess!({
      patientUUID: 'patient-2',
      encounterTypeName: 'Consultation',
      updatedConcepts: new Map(),
    });

    expect(mockDispatchAuditEvent).toHaveBeenCalledTimes(1);
    expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
      eventType: 'STOP_MEDICATION',
      patientUuid: 'patient-2',
      messageParams: {},
    });
  });
});
