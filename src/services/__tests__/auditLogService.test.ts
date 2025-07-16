import {
  logAuditEvent,
  logDashboardView,
  logEncounterEdit,
} from '../auditLogService';
import { isAuditLogEnabled } from '../globalPropertyService';
import client from '../api';
import { AUDIT_LOG_URL } from '@constants/app';
import { MODULE_LABELS } from '@constants/auditLog';
import { AuditEventType } from '@/types/auditLog';

// Mock dependencies
jest.mock('../globalPropertyService');
jest.mock('../api');

const mockIsAuditLogEnabled = isAuditLogEnabled as jest.MockedFunction<
  typeof isAuditLogEnabled
>;
const mockClient = client as jest.Mocked<typeof client>;

describe('auditLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logAuditEvent', () => {
    it('should return logged false without logging when audit logging is disabled', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(false);

      const result = await logAuditEvent(
        'patient-123',
        'VIEWED_CLINICAL_DASHBOARD',
      );

      expect(result).toEqual({ logged: false });
      expect(mockClient.post).not.toHaveBeenCalled();
    });

    it('should log audit event when audit logging is enabled', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockClient.post.mockResolvedValue({});

      const result = await logAuditEvent(
        'patient-123',
        'VIEWED_CLINICAL_DASHBOARD',
      );

      expect(result).toEqual({ logged: true });
      expect(mockClient.post).toHaveBeenCalledWith(
        AUDIT_LOG_URL,
        {
          patientUuid: 'patient-123',
          eventType: 'VIEWED_CLINICAL_DASHBOARD',
          message: 'VIEWED_CLINICAL_DASHBOARD_MESSAGE',
          module: MODULE_LABELS.CLINICAL,
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should include message parameters in audit log', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockClient.post.mockResolvedValue({});

      const messageParams = {
        encounterUuid: 'encounter-123',
        encounterType: 'Consultation',
      };
      const result = await logAuditEvent(
        'patient-123',
        'EDIT_ENCOUNTER',
        messageParams,
      );

      expect(result).toEqual({ logged: true });
      expect(mockClient.post).toHaveBeenCalledWith(
        AUDIT_LOG_URL,
        {
          patientUuid: 'patient-123',
          eventType: 'EDIT_ENCOUNTER',
          message: `EDIT_ENCOUNTER_MESSAGE~${JSON.stringify(messageParams)}`,
          module: MODULE_LABELS.CLINICAL,
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle unknown event types', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);

      const result = await logAuditEvent(
        'patient-123',
        'UNKNOWN_EVENT' as AuditEventType,
      );

      expect(result).toEqual({
        logged: false,
        error: 'Unknown audit event type: UNKNOWN_EVENT',
      });
      expect(mockClient.post).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockClient.post.mockRejectedValue(new Error('Network error'));

      const result = await logAuditEvent(
        'patient-123',
        'VIEWED_CLINICAL_DASHBOARD',
      );

      expect(result).toEqual({ logged: false, error: 'Network error' });
    });

    it('should handle non-Error exceptions', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockClient.post.mockRejectedValue('String error');

      const result = await logAuditEvent(
        'patient-123',
        'VIEWED_CLINICAL_DASHBOARD',
      );

      expect(result).toEqual({ logged: false, error: 'Unknown error' });
    });

    it('should handle audit log enablement check failure', async () => {
      mockIsAuditLogEnabled.mockRejectedValue(new Error('Config error'));

      const result = await logAuditEvent(
        'patient-123',
        'VIEWED_CLINICAL_DASHBOARD',
      );

      expect(result).toEqual({ logged: false, error: 'Config error' });
      expect(mockClient.post).not.toHaveBeenCalled();
    });

    it('should use custom module when provided', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockClient.post.mockResolvedValue({});

      const result = await logAuditEvent(
        'patient-123',
        'VIEWED_CLINICAL_DASHBOARD',
        undefined,
        'CUSTOM_MODULE',
      );

      expect(result).toEqual({ logged: true });
      expect(mockClient.post).toHaveBeenCalledWith(
        AUDIT_LOG_URL,
        {
          patientUuid: 'patient-123',
          eventType: 'VIEWED_CLINICAL_DASHBOARD',
          message: 'VIEWED_CLINICAL_DASHBOARD_MESSAGE',
          module: 'CUSTOM_MODULE',
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle undefined patient UUID', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockClient.post.mockResolvedValue({});

      const result = await logAuditEvent(
        undefined,
        'VIEWED_CLINICAL_DASHBOARD',
      );

      expect(result).toEqual({ logged: true });
      expect(mockClient.post).toHaveBeenCalledWith(
        AUDIT_LOG_URL,
        {
          patientUuid: undefined,
          eventType: 'VIEWED_CLINICAL_DASHBOARD',
          message: 'VIEWED_CLINICAL_DASHBOARD_MESSAGE',
          module: MODULE_LABELS.CLINICAL,
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    });
  });

  describe('logDashboardView', () => {
    it('should call logAuditEvent with correct parameters', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockClient.post.mockResolvedValue({});

      const result = await logDashboardView('patient-123');

      expect(result).toEqual({ logged: true });
      expect(mockClient.post).toHaveBeenCalledWith(
        AUDIT_LOG_URL,
        {
          patientUuid: 'patient-123',
          eventType: 'VIEWED_CLINICAL_DASHBOARD',
          message: 'VIEWED_CLINICAL_DASHBOARD_MESSAGE',
          module: MODULE_LABELS.CLINICAL,
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    });
  });

  describe('logEncounterEdit', () => {
    it('should call logAuditEvent with correct parameters and message params', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockClient.post.mockResolvedValue({});

      const result = await logEncounterEdit(
        'patient-123',
        'encounter-456',
        'Consultation',
      );

      const expectedMessageParams = {
        encounterUuid: 'encounter-456',
        encounterType: 'Consultation',
      };

      expect(result).toEqual({ logged: true });
      expect(mockClient.post).toHaveBeenCalledWith(
        AUDIT_LOG_URL,
        {
          patientUuid: 'patient-123',
          eventType: 'EDIT_ENCOUNTER',
          message: `EDIT_ENCOUNTER_MESSAGE~${JSON.stringify(expectedMessageParams)}`,
          module: MODULE_LABELS.CLINICAL,
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    });
  });
});
