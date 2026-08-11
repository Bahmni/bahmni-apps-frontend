import { dispatchAuditEvent, AUDIT_LOG_EVENT_DETAILS } from '@bahmni/services';
import { cancelVaccination } from '../../../../services/cancelVaccinationService';
import { useCancelVaccinationStore } from '../../../../stores/cancelVaccinationStore';
import { getRegisteredInputControls } from '../../registry';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchAuditEvent: jest.fn(),
}));

jest.mock('../../../../services/cancelVaccinationService', () => ({
  cancelVaccination: jest.fn(),
}));

jest.mock('../CancelVaccinationForm', () => () => null);

const mockCancelVaccination = cancelVaccination as jest.MockedFunction<
  typeof cancelVaccination
>;
const mockDispatchAuditEvent = dispatchAuditEvent as jest.MockedFunction<
  typeof dispatchAuditEvent
>;

describe('cancelVaccination input control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCancelVaccinationStore.getState().reset();
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

  it('reset() calls store reset', () => {
    const control = getCancelVaccinationControl()!;

    control.reset();

    const state = useCancelVaccinationStore.getState();
    expect(state.medicationToCancel).toBeNull();
    expect(state.cancellationReason).toBeNull();
    expect(state.note).toBe('');
  });

  it('validate() returns true when no medication is set', () => {
    const control = getCancelVaccinationControl()!;

    expect(control.validate()).toBe(true);
  });

  it('hasData() returns true when medicationToCancel is set', () => {
    const control = getCancelVaccinationControl()!;

    useCancelVaccinationStore.getState().setMedicationToCancel({
      resourceType: 'MedicationRequest',
      id: 'med-1',
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/p-1' },
    });

    expect(control.hasData()).toBe(true);
  });

  it('hasData() returns false when medicationToCancel is null', () => {
    const control = getCancelVaccinationControl()!;

    expect(control.hasData()).toBe(false);
  });

  describe('onDirectSubmit', () => {
    it('calls cancelVaccination with correct params', async () => {
      const control = getCancelVaccinationControl()!;

      mockCancelVaccination.mockResolvedValueOnce({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'stopped',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      const store = useCancelVaccinationStore.getState();
      store.setMedicationToCancel({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });
      store.setCancellationReason('Adverse reaction');
      store.setNote('Patient had rash');

      await control.onDirectSubmit!();

      expect(mockCancelVaccination).toHaveBeenCalledWith({
        medicationRequestId: 'med-1',
        reason: 'Adverse reaction',
        note: 'Patient had rash',
      });
    });

    it('defaults reason to an empty string when cancellationReason is null', async () => {
      const control = getCancelVaccinationControl()!;

      mockCancelVaccination.mockResolvedValueOnce({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'stopped',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      useCancelVaccinationStore.getState().setMedicationToCancel({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      await control.onDirectSubmit!();

      expect(mockCancelVaccination).toHaveBeenCalledWith(
        expect.objectContaining({ reason: '' }),
      );
    });

    it('omits note when note is empty', async () => {
      const control = getCancelVaccinationControl()!;

      mockCancelVaccination.mockResolvedValueOnce({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'stopped',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      useCancelVaccinationStore.getState().setMedicationToCancel({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      await control.onDirectSubmit!();

      expect(mockCancelVaccination).toHaveBeenCalledWith(
        expect.objectContaining({ note: undefined }),
      );
    });

    it('dispatches audit event after success', async () => {
      const control = getCancelVaccinationControl()!;

      mockCancelVaccination.mockResolvedValueOnce({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'stopped',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      const store = useCancelVaccinationStore.getState();
      store.setMedicationToCancel({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });
      store.setCancellationReason('Patient request');

      await control.onDirectSubmit!();

      expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
        eventType: AUDIT_LOG_EVENT_DETAILS.STOP_MEDICATION.eventType,
        patientUuid: 'patient-uuid-1',
        messageParams: {},
      });
    });

    it('derives encounterUuid from medicationToCancel.encounter.reference', async () => {
      const control = getCancelVaccinationControl()!;

      mockCancelVaccination.mockResolvedValueOnce({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'stopped',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      useCancelVaccinationStore.getState().setMedicationToCancel({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
        encounter: { reference: 'Encounter/enc-uuid-1' },
      });

      await control.onDirectSubmit!();

      expect(mockCancelVaccination).toHaveBeenCalledWith(
        expect.objectContaining({ encounterUuid: 'enc-uuid-1' }),
      );
    });

    it('omits encounterUuid when medicationToCancel has no encounter reference', async () => {
      const control = getCancelVaccinationControl()!;

      mockCancelVaccination.mockResolvedValueOnce({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'stopped',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      useCancelVaccinationStore.getState().setMedicationToCancel({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      await control.onDirectSubmit!();

      expect(mockCancelVaccination).toHaveBeenCalledWith(
        expect.objectContaining({ encounterUuid: undefined }),
      );
    });

    it('does not dispatch audit event when subject.reference is missing', async () => {
      const control = getCancelVaccinationControl()!;

      mockCancelVaccination.mockResolvedValueOnce({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'stopped',
        intent: 'order',
        subject: {},
      });

      useCancelVaccinationStore.getState().setMedicationToCancel({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: {},
      });

      await control.onDirectSubmit!();

      expect(mockCancelVaccination).toHaveBeenCalled();
      expect(mockDispatchAuditEvent).not.toHaveBeenCalled();
    });

    it('does nothing when medicationToCancel is null', async () => {
      const control = getCancelVaccinationControl()!;

      await control.onDirectSubmit!();

      expect(mockCancelVaccination).not.toHaveBeenCalled();
      expect(mockDispatchAuditEvent).not.toHaveBeenCalled();
    });

    it('does nothing when medicationToCancel has no id', async () => {
      const control = getCancelVaccinationControl()!;

      useCancelVaccinationStore.getState().setMedicationToCancel({
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      await control.onDirectSubmit!();

      expect(mockCancelVaccination).not.toHaveBeenCalled();
    });
  });
});
