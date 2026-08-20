import type { VisitType } from '../models';
import {
  checkIfActiveVisitExists,
  createVisitForPatient,
} from '../visitService';

const mockGetUserLoginLocation = jest.fn();
const mockDispatchAuditEvent = jest.fn();
const mockPost = jest.fn();
const mockGet = jest.fn();

jest.mock('../../api', () => ({
  post: (...args: any[]) => mockPost(...args),
  get: (...args: any[]) => mockGet(...args),
}));

jest.mock('../../userService/userService', () => ({
  getUserLoginLocation: () => mockGetUserLoginLocation(),
}));

jest.mock('../../auditLogService/auditEventDispatcher', () => ({
  dispatchAuditEvent: (...args: any[]) => mockDispatchAuditEvent(...args),
}));

jest.mock('../../auditLogService/constants', () => ({
  AUDIT_LOG_EVENT_DETAILS: {
    OPEN_VISIT: {
      eventType: 'OPEN_VISIT',
      module: 'REGISTRATION',
    },
  },
}));

describe('visitService', () => {
  const mockLoginLocation = {
    uuid: '9772f68d-9fc5-4470-9b87-2b6139011cad3',
  } as any;
  const mockVisitLocationUUID = {
    uuid: '72636eba-29bf-4d6c-97c4-4b04d87a95b5',
  };
  const mockVisitType: VisitType = {
    name: 'OPD',
    uuid: '54f43754-c6ce-4472-890e-0f28acaeaea6',
  };
  const patientUuid = '9891a8b4-7404-4c05-a207-5ec9d34fc719';

  const mockCreatedVisit = {
    uuid: 'created-visit-uuid-123',
    startDatetime: '2026-06-08T08:00:00.000+0000',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserLoginLocation.mockReturnValue(mockLoginLocation);
    mockGet.mockResolvedValue(mockVisitLocationUUID as any);
    mockPost.mockResolvedValue(mockCreatedVisit as any);
  });

  describe('checkIfActiveVisitExists', () => {
    it('should return true when active visit exists', async () => {
      mockGet.mockResolvedValue({
        results: [{ uuid: 'visit-uuid' }],
      } as any);

      const result = await checkIfActiveVisitExists(patientUuid);

      expect(result).toBe(true);
      expect(mockGet).toHaveBeenCalled();
    });

    it('should return false when no active visit exists', async () => {
      mockGet.mockResolvedValue({ results: [] } as any);

      const result = await checkIfActiveVisitExists(patientUuid);

      expect(result).toBe(false);
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('createVisitForPatient', () => {
    it('should create visit and dispatch audit event on success', async () => {
      // Mock for getVisitLocationUUID
      mockGet.mockResolvedValueOnce(mockVisitLocationUUID as any);
      // Mock for createVisit
      mockPost.mockResolvedValueOnce({} as any);

      await createVisitForPatient(patientUuid, mockVisitType);

      expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('/visit'), {
        patient: patientUuid,
        visitType: mockVisitType.uuid,
        location: mockVisitLocationUUID.uuid,
      });
      expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
        eventType: expect.any(String),
        patientUuid,
        messageParams: { visitType: mockVisitType.name },
        module: expect.any(String),
      });
    });

    it('should return the created visit with uuid and startDatetime', async () => {
      mockGet.mockResolvedValueOnce(mockVisitLocationUUID as any);
      mockPost.mockResolvedValueOnce(mockCreatedVisit as any);

      const result = await createVisitForPatient(patientUuid, mockVisitType);

      expect(result.uuid).toBe(mockCreatedVisit.uuid);
      expect(result.startDatetime).toBe(mockCreatedVisit.startDatetime);
    });

    it('should request uuid and startDatetime in the visit POST representation', async () => {
      mockGet.mockResolvedValueOnce(mockVisitLocationUUID as any);
      mockPost.mockResolvedValueOnce(mockCreatedVisit as any);

      await createVisitForPatient(patientUuid, mockVisitType);

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('v=custom:(uuid,startDatetime)'),
        expect.any(Object),
      );
    });
  });
});
