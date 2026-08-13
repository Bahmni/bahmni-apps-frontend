import { dispatchAuditEvent, AUDIT_LOG_EVENT_DETAILS } from '@bahmni/services';
import { createStopMedicationEntry } from '../../../../services/stopMedicationService';
import { useStopMedicationStore } from '../../../../stores/stopMedicationsStore';
import type { EncounterContext } from '../../models';
import { getRegisteredInputControls } from '../../registry';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchAuditEvent: jest.fn(),
  createBundleEntry: jest.fn((fullUrl, resource, method) => ({
    fullUrl,
    resource,
    request: { method, url: resource.resourceType },
  })),
}));

jest.mock('../../../../services/stopMedicationService', () => ({
  createStopMedicationEntry: jest.fn(() => ({
    resource: { resourceType: 'MedicationRequest' },
  })),
}));

jest.mock('../StopMedicationForm', () => () => null);

const mockCreateStopMedicationEntry =
  createStopMedicationEntry as jest.MockedFunction<
    typeof createStopMedicationEntry
  >;
const mockDispatchAuditEvent = dispatchAuditEvent as jest.MockedFunction<
  typeof dispatchAuditEvent
>;

const baseCtx: EncounterContext = {
  encounterReference: 'enc-uuid-1',
  encounterSubject: { reference: 'Patient/patient-uuid-1' },
  practitionerUUID: 'practitioner-uuid',
  consultationDate: new Date('2025-06-10'),
};

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

  describe('createBundleEntries', () => {
    it('calls createStopMedicationEntry with correct params and returns entries', () => {
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

      const entries =
        getStopMedicationsControl()!.createBundleEntries!(baseCtx);

      expect(mockCreateStopMedicationEntry).toHaveBeenCalledWith({
        medicationRequestId: 'med-1',
        patientUuid: 'patient-uuid-1',
        reason: { uuid: 'reason-uuid-1', display: 'Adverse reaction' },
        effectiveDate: stopDate,
        note: 'Patient had rash',
        ctx: baseCtx,
      });
      expect(entries).toHaveLength(1);
    });

    it('dispatches audit event', () => {
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

      getStopMedicationsControl()!.createBundleEntries!(baseCtx);

      expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
        eventType: AUDIT_LOG_EVENT_DETAILS.STOP_MEDICATION.eventType,
        patientUuid: 'patient-uuid-1',
        messageParams: {},
      });
    });

    it('returns empty array when medicationToStop is null', () => {
      const entries =
        getStopMedicationsControl()!.createBundleEntries!(baseCtx);
      expect(entries).toEqual([]);
      expect(mockCreateStopMedicationEntry).not.toHaveBeenCalled();
    });

    it('returns empty array when medicationToStop has no id', () => {
      const store = useStopMedicationStore.getState();
      store.setMedicationToStop({
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });
      store.setStopReason({ uuid: 'reason-uuid-1', display: 'reason' });

      const entries =
        getStopMedicationsControl()!.createBundleEntries!(baseCtx);
      expect(entries).toEqual([]);
    });

    it('returns empty array when stopReason is null', () => {
      const store = useStopMedicationStore.getState();
      store.setMedicationToStop({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/patient-uuid-1' },
      });

      const entries =
        getStopMedicationsControl()!.createBundleEntries!(baseCtx);
      expect(entries).toEqual([]);
    });

    it('returns empty array when subject reference is missing', () => {
      const store = useStopMedicationStore.getState();
      store.setMedicationToStop({
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: {},
      });
      store.setStopReason({ uuid: 'reason-uuid-1', display: 'reason' });

      const entries =
        getStopMedicationsControl()!.createBundleEntries!(baseCtx);
      expect(entries).toEqual([]);
    });

    it('omits note when note is empty', () => {
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

      getStopMedicationsControl()!.createBundleEntries!(baseCtx);

      expect(mockCreateStopMedicationEntry).toHaveBeenCalledWith(
        expect.objectContaining({ note: undefined }),
      );
    });
  });
});
