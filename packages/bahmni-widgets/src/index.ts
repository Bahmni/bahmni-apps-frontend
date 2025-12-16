import '@bahmni/design-system/styles';

// Widget Components
export { PatientDetails } from './patientDetails';
export { AllergiesTable } from './allergies';
export { ConditionsTable, conditionsQueryKeys } from './conditions';
export { DiagnosesTable } from './diagnoses';
export { MedicationsTable } from './medications';
export { RadiologyInvestigationTable } from './radiologyInvestigation';
export { LabInvestigation } from './labinvestigation';
export { SearchPatient } from './searchPatient';
export { VitalFlowSheet } from './vitalFlowSheet';
export { GenericServiceRequestTable } from './genericServiceRequest';
export { ProgramsDetails } from './programs';

// Notification System
export {
  useNotification,
  NotificationProvider,
  NotificationServiceComponent,
} from './notification';

// Hooks
export { usePatientUUID } from './hooks/usePatientUUID';
export { useActivePractitioner } from './hooks/useActivePractitioner';
export { useUserPrivilege } from './userPrivileges/useUserPrivilege';

// User Privileges
export { UserPrivilegeProvider } from './userPrivileges/UserPrivilegeProvider';

// Widget Registry
export {
  registerWidget,
  getWidget,
  getWidgetConfig,
  hasWidget,
  getAllWidgetTypes,
  getAllWidgetConfigs,
  resetWidgetRegistry,
  type WidgetConfig,
} from './registry';
