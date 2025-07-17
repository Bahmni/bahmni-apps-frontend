import { AUDIT_LOG_GLOBAL_PROPERTY } from '@constants/auditLog';
import { getGlobalProperty } from './globalPropertyService';
/**
 * Check if audit logging is enabled
 * @returns Promise<boolean>
 */
export const isAuditLogEnabled = async (): Promise<boolean> => {
  // try {
  const value = await getGlobalProperty(AUDIT_LOG_GLOBAL_PROPERTY);
  return value === 'true';
  // TODO: handle specific error cases when status check for the global property fails
  // } catch (error) {
  //   // eslint-disable-next-line no-console
  //   console.error(
  //     i18next.t(AUDIT_LOG_ERROR_MESSAGES.STATUS_CHECK_FAILED),
  //     error,
  //   );
  //   return false;
  // }
};
