import {
  dispatchAuditEvent,
  AUDIT_LOG_EVENT_DETAILS,
} from '@bahmni/services';
import { stopMedication } from '../../../../services/stopMedicationService';
import { useStopMedicationStore } from '../../../../stores/stopMedicationsStore';
import { getRegisteredInputControls, clearRegistry } from '../../registry';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchAuditEvent: jest.fn(),
}));

jest.mock('../../../../services/stopMedicationService', () => ({
  stopMedication: jest.fn(),
}));

// Mock the StopMedicationForm component to avoid its deep dependency tree
jest.mock('../StopMedicationForm', () => () => null);

const mockStopMedication = stopMedication as jest.MockedFunction<
  typeof stopMedication
>;
const mockDispatchAuditEvent = dispatchAuditEvent as jest.MockedFunction<
  typeof dispatchAuditEvent
>;

describe('stopMedications input control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStopMedicationStore.getState().reset();
  });

  // Import the module to trigger registerInputControl
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
    const control = getStopMedicationsControl()!;
    const resetSpy = jest.spyOn(useStopMedicationStore.getState(), 'reset');

    control.reset();

    // Verify the store was reset (stopReason should be null after reset)
    const state = useStopMedicationStore.getState();
    expect(state.medicationToStop).toBeNull();
    expect(state.stopReason).toBeNull();
    expect(state.note).toBe('');
  });

  it('validate() calls store validate', () => {
    const control = getStopMedicationsControl()!;

    // No medication set -> validate returns true
    const result = control.validate();
    expect(result).toBe(true);
  });

  it('validate() returns false when mandatory fields are missing', () => {
    const control = getStopMedicationsControl()!;

    useStopMedicationStore.getState().setMedicationToStop({
      resourceType: 'MedicationRequest',
      id: 'med-1',
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/p-1' },
    });

    const result = control.validate();
    expect(result).toBe(false);
  });

  it('hasData() returns true when medicationToStop is set', () => {
    const control = getStopMedicationsControl()!;

    useStopMedicationStore.getState().setMedicationToStop({
      resourceType: 'MedicationRequest',
      id: 'med-1',
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/p-1' },
    });

    expect(control.hasData()).toBe(true);
  });

  it('hasData() returns false when medicationToStop is null', () => {
    const control = getStopMedicationsControl()!;

    expect(control.hasData()).toBe(false);
  });

  describe('onDirectSubmit', () => {
    it('calls stopMedication with correct params', async () => {
      const control = getStopMedicationsControl()!;

      mockStopMedication.mockResolvedValueOnce({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'stopped',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      const stopDate = new Date('2025-06-10');
      const store = useStopMedicationStore.getState();
      store.setMedicationToStop({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });
      store.setStopReason('Adverse reaction');
      store.setStopDate(stopDate);
      store.setNote('Patient had rash');

      await control.onDirectSubmit!();

      expect(mockStopMedication).toHaveBeenCalledWith({
        medicationRequestId: 'med-1',
        reason: 'Adverse reaction',
        effectiveDate: stopDate,
        note: 'Patient had rash',
      });
    });

    it('dispatches audit event after success', async () => {
      const control = getStopMedicationsControl()!;

      mockStopMedication.mockResolvedValueOnce({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'stopped',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      const store = useStopMedicationStore.getState();
      store.setMedicationToStop({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });
      store.setStopReason('Patient request');
      store.setStopDate(new Date());

      await control.onDirectSubmit!();

      expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
        eventType: AUDIT_LOG_EVENT_DETAILS.STOP_MEDICATION.eventType,
        patientUuid: 'patient-uuid-1',
        messageParams: {},
      });
    });

    it('does nothing when medicationToStop is null', async () => {
      const control = getStopMedicationsControl()!;

      await control.onDirectSubmit!();

      expect(mockStopMedication).not.toHaveBeenCalled();
      expect(mockDispatchAuditEvent).not.toHaveBeenCalled();
    });

    it('does nothing when medicationToStop has no id', async () => {
      const control = getStopMedicationsControl()!;

      const store = useStopMedicationStore.getState();
      store.setMedicationToStop({
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });
      store.setStopReason('reason');

      await control.onDirectSubmit!();

      expect(mockStopMedication).not.toHaveBeenCalled();
    });

    it('does nothing when stopReason is null', async () => {
      const control = getStopMedicationsControl()!;

      const store = useStopMedicationStore.getState();
      store.setMedicationToStop({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      await control.onDirectSubmit!();

      expect(mockStopMedication).not.toHaveBeenCalled();
    });

    it('omits note when note is empty', async () => {
      const control = getStopMedicationsControl()!;

      mockStopMedication.mockResolvedValueOnce({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'stopped',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      const store = useStopMedicationStore.getState();
      store.setMedicationToStop({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });
      store.setStopReason('reason');
      store.setStopDate(new Date());
      // note is empty string by default

      await control.onDirectSubmit!();

      expect(mockStopMedication).toHaveBeenCalledWith(
        expect.objectContaining({
          note: undefined,
        }),
      );
    });
  });
});
