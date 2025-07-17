import { AuditEventType } from '@/types/auditLog';
import { AUDIT_LOG_URL } from '@constants/app';
import { MODULE_LABELS } from '@constants/auditLog';
import { post } from '../api';
import {
  logAuditEvent,
  logDashboardView,
  logEncounterEdit,
} from '../auditLogService';
import { isAuditLogEnabled } from '../globalPropertyConfigService';

// Mock dependencies
jest.mock('../globalPropertyConfigService');
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
        'patient-123',
        'VIEWED_CLINICAL_DASHBOARD',
      );

      expect(result).toEqual({ logged: true });
      expect(mockPost).toHaveBeenCalledWith(AUDIT_LOG_URL, {
        patientUuid: 'patient-123',
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
        'patient-123',
        'EDIT_ENCOUNTER',
        messageParams,
      );

      expect(result).toEqual({ logged: true });
      expect(mockPost).toHaveBeenCalledWith(AUDIT_LOG_URL, {
        patientUuid: 'patient-123',
        eventType: 'EDIT_ENCOUNTER',
        message: `EDIT_ENCOUNTER_MESSAGE~${JSON.stringify(messageParams)}`,
        module: MODULE_LABELS.CLINICAL,
      });
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
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should use custom module when provided', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockPost.mockResolvedValue({});

      const result = await logAuditEvent(
        'patient-123',
        'VIEWED_CLINICAL_DASHBOARD',
        undefined,
        'CUSTOM_MODULE',
      );

      expect(result).toEqual({ logged: true });
      expect(mockPost).toHaveBeenCalledWith(AUDIT_LOG_URL, {
        patientUuid: 'patient-123',
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        message: 'VIEWED_CLINICAL_DASHBOARD_MESSAGE',
        module: 'CUSTOM_MODULE',
      });
    });

    it('should handle undefined patient UUID', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockPost.mockResolvedValue({});

      const result = await logAuditEvent(
        undefined,
        'VIEWED_CLINICAL_DASHBOARD',
      );

      expect(result).toEqual({ logged: true });
      expect(mockPost).toHaveBeenCalledWith(AUDIT_LOG_URL, {
        patientUuid: undefined,
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        message: 'VIEWED_CLINICAL_DASHBOARD_MESSAGE',
        module: MODULE_LABELS.CLINICAL,
      });
    });
  });

  describe('logDashboardView', () => {
    it('should call logAuditEvent with correct parameters', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockPost.mockResolvedValue({});

      const result = await logDashboardView('patient-123');

      expect(result).toEqual({ logged: true });
      expect(mockPost).toHaveBeenCalledWith(AUDIT_LOG_URL, {
        patientUuid: 'patient-123',
        eventType: 'VIEWED_CLINICAL_DASHBOARD',
        message: 'VIEWED_CLINICAL_DASHBOARD_MESSAGE',
        module: MODULE_LABELS.CLINICAL,
      });
    });
  });

  describe('logEncounterEdit', () => {
    it('should call logAuditEvent with correct parameters and message params', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockPost.mockResolvedValue({});

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
      expect(mockPost).toHaveBeenCalledWith(AUDIT_LOG_URL, {
        patientUuid: 'patient-123',
        eventType: 'EDIT_ENCOUNTER',
        message: `EDIT_ENCOUNTER_MESSAGE~${JSON.stringify(expectedMessageParams)}`,
        module: MODULE_LABELS.CLINICAL,
      });
    });
  });
});
