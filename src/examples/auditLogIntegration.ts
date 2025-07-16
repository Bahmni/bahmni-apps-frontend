/**
 * Examples of how to integrate audit logging in clinical components
 * Based on openmrs-bahmni-apps implementation patterns
 */

import {
  logDashboardView,
  logEncounterEdit,
} from '../services/auditLogService';

export const handleDashboardView = async (patientUuid: string) => {
  await logDashboardView(patientUuid);
};

export const handleEncounterSave = async (
  patientUuid: string,
  encounterUuid: string,
  encounterType: string,
) => {
  await logEncounterEdit(patientUuid, encounterUuid, encounterType);
};
