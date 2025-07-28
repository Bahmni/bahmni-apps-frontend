import { AuditEventType } from '@/types/auditLog';
import { AUDIT_LOG_URL } from '@constants/app';
import { MODULE_LABELS } from '@constants/auditLog';
import { post } from '../api';
import { isAuditLogEnabled } from '../ApplicationConfigService';
import { logAuditEvent } from '../auditLogService';

// Mock dependencies
jest.mock('../ApplicationConfigService');
jest.mock('../api');

const mockIsAuditLogEnabled = isAuditLogEnabled as jest.MockedFunction<
  typeof isAuditLogEnabled
>;
const mockPost = post as jest.MockedFunction<typeof post>;

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
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should log audit event when audit logging is enabled', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockPost.mockResolvedValue({});

      const result = await logAuditEvent(
        'patient-456',
        'VIEWED_CLINICAL_DASHBOARD',
      );

      expect(result).toEqual({ logged: true });
      expect(mockPost).toHaveBeenCalledWith(AUDIT_LOG_URL, {
        patientUuid: 'patient-456',
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        message: 'VIEWED_CLINICAL_DASHBOARD_MESSAGE',
        module: MODULE_LABELS.CLINICAL,
      });
    });

    it('should include message parameters in audit log', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockPost.mockResolvedValue({});

      const messageParams = {
        encounterUuid: 'encounter-123',
        encounterType: 'Consultation',
      };
      const result = await logAuditEvent(
        'patient-789',
        'EDIT_ENCOUNTER',
        messageParams,
      );

      expect(result).toEqual({ logged: true });
      expect(mockPost).toHaveBeenCalledWith(AUDIT_LOG_URL, {
        patientUuid: 'patient-789',
        eventType: 'EDIT_ENCOUNTER',
        message: `EDIT_ENCOUNTER_MESSAGE~${JSON.stringify(messageParams)}`,
        module: MODULE_LABELS.CLINICAL,
      });
    });

    it('should handle unknown event types', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);

      const result = await logAuditEvent(
        'patient-unknown',
        'UNKNOWN_EVENT' as AuditEventType,
      );

      expect(result).toEqual({
        logged: false,
        error: 'Unknown audit event type: UNKNOWN_EVENT',
      });
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should use custom module when provided', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockPost.mockResolvedValue({});

      const result = await logAuditEvent(
        'patient-custom',
        'VIEWED_CLINICAL_DASHBOARD',
        undefined,
        'CUSTOM_MODULE',
      );

      expect(result).toEqual({ logged: true });
      expect(mockPost).toHaveBeenCalledWith(AUDIT_LOG_URL, {
        patientUuid: 'patient-custom',
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        message: 'VIEWED_CLINICAL_DASHBOARD_MESSAGE',
        module: 'CUSTOM_MODULE',
      });
    });

    it('should handle undefined message params', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockPost.mockResolvedValue({});

      const result = await logAuditEvent(
        'patient-undefined-params',
        'VIEWED_CLINICAL_DASHBOARD',
        undefined,
      );

      expect(result).toEqual({ logged: true });
      expect(mockPost).toHaveBeenCalledWith(AUDIT_LOG_URL, {
        patientUuid: 'patient-undefined-params',
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        message: 'VIEWED_CLINICAL_DASHBOARD_MESSAGE',
        module: MODULE_LABELS.CLINICAL,
      });
    });
  });
});
