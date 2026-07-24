import { get,post } from '../../api';
import { TASKS_URL,FHIR_TASK_URL } from '../constants';
import { getTasks,createTask } from '../taskService';
import { emptyTaskBundle, mockTaskBundle } from './__mocks__/taskServiceMocks';

jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;

describe('taskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTasks', () => {
    const patientUuid = '6db60a96-a688-4891-b9f6-59c78db52215';

    it('should fetch tasks with required parameters', async () => {
      mockedGet.mockResolvedValueOnce(mockTaskBundle);

      await getTasks(patientUuid);

      expect(mockedGet).toHaveBeenCalledWith(TASKS_URL(patientUuid));
    });

    it('should fetch tasks with empty encounterUuids array', async () => {
      const encounterUuids: string[] = [];
      mockedGet.mockResolvedValueOnce(mockTaskBundle);

      await getTasks(patientUuid, undefined, encounterUuids);

      expect(mockedGet).toHaveBeenCalledWith(
        TASKS_URL(patientUuid, undefined, encounterUuids),
      );
    });

    it('should fetch tasks with all optional parameters', async () => {
      const basedOnReference = 'ServiceRequest/service-123';
      const encounterUuids = ['encounter-1'];
      mockedGet.mockResolvedValueOnce(mockTaskBundle);

      await getTasks(patientUuid, basedOnReference, encounterUuids);

      expect(mockedGet).toHaveBeenCalledWith(
        TASKS_URL(patientUuid, basedOnReference, encounterUuids),
      );
    });

    it('should handle empty string patientUuid', async () => {
      const emptyPatientUuid = '';
      mockedGet.mockResolvedValueOnce(emptyTaskBundle);

      await getTasks(emptyPatientUuid);

      expect(mockedGet).toHaveBeenCalledWith(TASKS_URL(emptyPatientUuid));
    });

    it('should propagate API errors when request fails', async () => {
      const patientUuid = '6db60a96-a688-4891-b9f6-59c78db52215';
      const error = new Error('Network error');
      mockedGet.mockRejectedValueOnce(error);

      await expect(getTasks(patientUuid)).rejects.toThrow('Network error');
    });

    it('should propagate API errors with status codes', async () => {
      const patientUuid = '6db60a96-a688-4891-b9f6-59c78db52215';
      const error = { status: 404, message: 'Patient not found' };
      mockedGet.mockRejectedValueOnce(error);

      await expect(getTasks(patientUuid)).rejects.toEqual(error);
    });
  });
});

describe('taskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a task with all fields (status, notes, owner, encounter, and patient)', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask('order-uuid', 'requested', {
      notes: 'Patient ready',
      ownerUuid: 'provider-uuid',
      encounterUuid: 'encounter-uuid',
      patientUuid: 'patient-uuid',
    });

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'requested',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
      for: { reference: 'Patient/patient-uuid' },
      note: [{ text: 'Patient ready' }],
      owner: { reference: 'Practitioner/provider-uuid' },
      encounter: { reference: 'Encounter/encounter-uuid' },
    });
  });

  it('creates a task with patient reference only', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask('order-uuid', 'requested', {
      patientUuid: 'patient-uuid',
    });

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'requested',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
      for: { reference: 'Patient/patient-uuid' },
    });
    const payload = (post as jest.Mock).mock.calls[0][1];
    expect(payload.note).toBeUndefined();
    expect(payload.owner).toBeUndefined();
    expect(payload.encounter).toBeUndefined();
  });

  it('creates a task with notes and owner (no patient, no encounter)', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask('order-uuid', 'accepted', {
      notes: 'In progress',
      ownerUuid: 'provider-uuid',
    });

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'accepted',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
      note: [{ text: 'In progress' }],
      owner: { reference: 'Practitioner/provider-uuid' },
    });
    const payload = (post as jest.Mock).mock.calls[0][1];
    expect(payload.for).toBeUndefined();
    expect(payload.encounter).toBeUndefined();
  });

  it('creates a task with encounter reference', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask('order-uuid', 'completed', {
      encounterUuid: 'encounter-uuid',
    });

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'completed',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
      encounter: { reference: 'Encounter/encounter-uuid' },
    });
    const payload = (post as jest.Mock).mock.calls[0][1];
    expect(payload.for).toBeUndefined();
    expect(payload.note).toBeUndefined();
    expect(payload.owner).toBeUndefined();
  });

  it('creates a task with status only (no optional fields)', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask('order-uuid', 'requested');

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'requested',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
    });
    const payload = (post as jest.Mock).mock.calls[0][1];
    expect(payload.for).toBeUndefined();
    expect(payload.note).toBeUndefined();
    expect(payload.owner).toBeUndefined();
    expect(payload.encounter).toBeUndefined();
  });

  it('creates a task with draft status for New order', async () => {
    (post as jest.Mock).mockResolvedValueOnce({});

    await createTask('order-uuid', 'draft', { patientUuid: 'patient-uuid' });

    expect(post).toHaveBeenCalledWith(FHIR_TASK_URL, {
      resourceType: 'Task',
      intent: 'order',
      status: 'draft',
      basedOn: [{ reference: 'ServiceRequest/order-uuid' }],
      for: { reference: 'Patient/patient-uuid' },
    });
  });

  it('propagates errors from the API', async () => {
    (post as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    await expect(createTask('order-uuid', 'requested')).rejects.toThrow(
      'API Error',
    );
  });
});
