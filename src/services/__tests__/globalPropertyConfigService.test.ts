import { AUDIT_LOG_GLOBAL_PROPERTY } from '@constants/auditLog';
import { isAuditLogEnabled } from '../globalPropertyConfigService';
import { getGlobalProperty } from '../globalPropertyService';

// Mock dependencies
jest.mock('../globalPropertyService');
jest.mock('i18next');

const mockGetGlobalProperty = getGlobalProperty as jest.MockedFunction<
  typeof getGlobalProperty
>;

describe('globalPropertyConfigService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isAuditLogEnabled', () => {
    it('should return true when global property value is "true"', async () => {
      mockGetGlobalProperty.mockResolvedValue('true');

      const result = await isAuditLogEnabled();

      expect(mockGetGlobalProperty).toHaveBeenCalledWith(
        AUDIT_LOG_GLOBAL_PROPERTY,
      );
      expect(result).toBe(true);
    });

    it('should return false when global property value is "false"', async () => {
      mockGetGlobalProperty.mockResolvedValue('false');

      const result = await isAuditLogEnabled();

      expect(mockGetGlobalProperty).toHaveBeenCalledWith(
        AUDIT_LOG_GLOBAL_PROPERTY,
      );
      expect(result).toBe(false);
    });

    it('should return false when global property value is null', async () => {
      mockGetGlobalProperty.mockResolvedValue(null);

      const result = await isAuditLogEnabled();

      expect(mockGetGlobalProperty).toHaveBeenCalledWith(
        AUDIT_LOG_GLOBAL_PROPERTY,
      );
      expect(result).toBe(false);
    });

    it('should return false when global property value is any other string', async () => {
      mockGetGlobalProperty.mockResolvedValue('some-other-value');

      const result = await isAuditLogEnabled();

      expect(mockGetGlobalProperty).toHaveBeenCalledWith(
        AUDIT_LOG_GLOBAL_PROPERTY,
      );
      expect(result).toBe(false);
    });
  });
});
