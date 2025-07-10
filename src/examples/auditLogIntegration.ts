/**
 * Examples of how to integrate audit logging in clinical components
 * Based on openmrs-bahmni-apps implementation patterns
 */

import { logDashboardView, logEncounterEdit } from '../services/auditLogService';
import { AUDIT_LOG_ERROR_MESSAGES } from '../constants/errors';
import i18next from 'i18next';

// Create local alias for cleaner code
const t = i18next.t;

export const handleDashboardView = async (patientUuid: string) => {
  try {
    await logDashboardView(patientUuid);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(t(AUDIT_LOG_ERROR_MESSAGES.DASHBOARD_VIEW_FAILED), error);
  }
};

export const handleEncounterSave = async (
  patientUuid: string,
  encounterUuid: string,
  encounterType: string
) => {
  try {
    await logEncounterEdit(patientUuid, encounterUuid, encounterType);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(t(AUDIT_LOG_ERROR_MESSAGES.ENCOUNTER_SAVE_FAILED), error);
  }
};