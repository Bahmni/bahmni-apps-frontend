import { dispatchAuditEvent, AUDIT_LOG_EVENT_DETAILS } from '@bahmni/services';
import { stopMedication } from '../../../../services/stopMedicationService';
import { useStopMedicationStore } from '../../../../stores/stopMedicationsStore';
import { getRegisteredInputControls } from '../../registry';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchAuditEvent: jest.fn(),
}));

jest.mock('../../../../services/stopMedicationService', () => ({
  stopMedication: jest.fn(),
}));

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

  describe('onDirectSubmit', () => {
    it('calls stopMedication with correct params including patientUuid', async () => {
      mockStopMedication.mockResolvedValueOnce(undefined);
      const stopDate = new Date('2025-06-10');
      const store = useStopMedicationStore.getState();
      store.setMedicationToStop({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });
      store.setStopReason({
        uuid: 'reason-uuid-1',
        display: 'Adverse reaction',
      });
      store.setStopDate(stopDate);
      store.setNote('Patient had rash');

      await getStopMedicationsControl()!.onDirectSubmit!();

      expect(mockStopMedication).toHaveBeenCalledWith({
        medicationRequestId: 'med-1',
        patientUuid: 'patient-uuid-1',
        reason: { uuid: 'reason-uuid-1', display: 'Adverse reaction' },
        effectiveDate: stopDate,
        note: 'Patient had rash',
      });
    });

    it('dispatches audit event after success', async () => {
      mockStopMedication.mockResolvedValueOnce(undefined);
      const store = useStopMedicationStore.getState();
      store.setMedicationToStop({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });
      store.setStopReason({
        uuid: 'reason-uuid-2',
        display: 'Patient request',
      });
      store.setStopDate(new Date());

      await getStopMedicationsControl()!.onDirectSubmit!();

      expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
        eventType: AUDIT_LOG_EVENT_DETAILS.STOP_MEDICATION.eventType,
        patientUuid: 'patient-uuid-1',
        messageParams: {},
      });
    });

    it('does nothing when medicationToStop is null', async () => {
      await getStopMedicationsControl()!.onDirectSubmit!();
      expect(mockStopMedication).not.toHaveBeenCalled();
      expect(mockDispatchAuditEvent).not.toHaveBeenCalled();
    });

    it('does nothing when medicationToStop has no id', async () => {
      const store = useStopMedicationStore.getState();
      store.setMedicationToStop({
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });
      store.setStopReason({ uuid: 'reason-uuid-1', display: 'reason' });

      await getStopMedicationsControl()!.onDirectSubmit!();
      expect(mockStopMedication).not.toHaveBeenCalled();
    });

    it('does nothing when stopReason is null', async () => {
      const store = useStopMedicationStore.getState();
      store.setMedicationToStop({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      await getStopMedicationsControl()!.onDirectSubmit!();
      expect(mockStopMedication).not.toHaveBeenCalled();
    });

    it('does not dispatch audit event when subject.reference is missing', async () => {
      mockStopMedication.mockResolvedValueOnce(undefined);
      const store = useStopMedicationStore.getState();
      store.setMedicationToStop({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: {},
      });
      store.setStopReason({ uuid: 'reason-uuid-1', display: 'reason' });
      store.setStopDate(new Date());

      await getStopMedicationsControl()!.onDirectSubmit!();

      expect(mockStopMedication).not.toHaveBeenCalled();
      expect(mockDispatchAuditEvent).not.toHaveBeenCalled();
    });

    it('omits note when note is empty', async () => {
      mockStopMedication.mockResolvedValueOnce(undefined);
      const store = useStopMedicationStore.getState();
      store.setMedicationToStop({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });
      store.setStopReason({ uuid: 'reason-uuid-1', display: 'reason' });
      store.setStopDate(new Date());

      await getStopMedicationsControl()!.onDirectSubmit!();

      expect(mockStopMedication).toHaveBeenCalledWith(
        expect.objectContaining({ note: undefined }),
      );
    });
  });
});
