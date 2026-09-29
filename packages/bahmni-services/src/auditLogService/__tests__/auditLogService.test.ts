import { post } from '../../api';
import { isAuditLogEnabled } from '../../applicationConfigService';
import { logAuditEvent } from '../auditLogService';
import { MODULE_LABELS, AUDIT_LOG_URL } from '../constants';
import { AuditEventType } from '../models';

// Mock dependencies
jest.mock('../../applicationConfigService');
jest.mock('../../api');

const mockIsAuditLogEnabled = isAuditLogEnabled as jest.MockedFunction<
  typeof isAuditLogEnabled
>;
const mockPost = post as jest.MockedFunction<typeof post>;

const TRANSLATIONS: Record<string, string> = {
  VIEWED_CLINICAL_DASHBOARD_MESSAGE: 'Viewed clinical dashboard',
  EDIT_ENCOUNTER_MESSAGE: 'Edited encounter',
  VIEWED_RADIOLOGY_RESULTS_MESSAGE: 'Viewed radiology results',
};

jest.mock('i18next', () => ({
  t: (key: string) => TRANSLATIONS[key] ?? key,
}));

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
        message: 'Viewed clinical dashboard',
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
        message: `Edited encounter~${JSON.stringify(messageParams)}`,
        module: MODULE_LABELS.CLINICAL,
      });
    });

    it('should send the translated message instead of the raw i18n key', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);
      mockPost.mockResolvedValue({});

      await logAuditEvent('patient-radiology', 'VIEWED_RADIOLOGY_RESULTS');

      expect(mockPost).toHaveBeenCalledWith(
        AUDIT_LOG_URL,
        expect.objectContaining({ message: 'Viewed radiology results' }),
      );
      const postedMessage = mockPost.mock.calls[0][1].message;
      expect(postedMessage).not.toContain('_MESSAGE');
    });

    it('should handle unknown event types', async () => {
      mockIsAuditLogEnabled.mockResolvedValue(true);

      const result = await logAuditEvent(
        'patient-unknown',
        'UNKNOWN_EVENT' as AuditEventType,
      );

      expect(result).toEqual({
        logged: false,
        error: 'AUDIT_LOG_ERROR_UNKNOWN_EVENT_TYPE',
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
        message: 'Viewed clinical dashboard',
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
        message: 'Viewed clinical dashboard',
        module: MODULE_LABELS.CLINICAL,
      });
    });
  });
});
