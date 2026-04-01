import '@bahmni/design-system/styles';

// Widget Components
export { PatientDetails } from './patientDetails';
export { AllergiesTable } from './allergies';
export { AppointmentsTable } from './appointments';
export { ConditionsTable } from './conditions';
export { DiagnosesTable } from './diagnoses';
export { MedicationsTable } from './medications';
export { RadiologyInvestigationTable } from './radiologyInvestigation';
export { RadiologyInvestigationReport } from './radiologyInvestigationReport';
export { LabInvestigation } from './labinvestigation';
export { SearchPatient } from './searchPatient';
export { VitalFlowSheet } from './vitalFlowSheet';
export { GenericServiceRequestTable } from './genericServiceRequest';
export { PatientProgramsTable } from './patientPrograms';
export { ProgramDetails } from './programDetails';

// Notification System
export {
  useNotification,
  NotificationProvider,
  NotificationServiceComponent,
} from './notification';

// Hooks
export { usePatientUUID } from './hooks/usePatientUUID';
export { useUserPrivilege } from './userPrivileges/useUserPrivilege';
export { useHasPrivilege } from './userPrivileges/useHasPrivilege';

// User Privileges
export { UserPrivilegeProvider } from './userPrivileges/UserPrivilegeProvider';
export { CONSULTATION_PAD_PRIVILEGES } from './userPrivileges/consultationPadPrivileges';

// App Context
export { AppContextProvider } from './appContext';

// Active Practitioner
export {
  ActivePractitionerProvider,
  useActivePractitioner,
  ActivePractitionerContext,
  type ActivePractitionerContextType,
} from './activePractitioner';

// Config Provider Factories
export { createConfigProvider, createConfigHook } from './configProvider';

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
