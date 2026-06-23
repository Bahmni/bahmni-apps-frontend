import '@bahmni/design-system/styles';

export {
  default as ConfirmationModal,
  type ConfirmationModalProps,
} from './confirmationModal/ConfirmationModal';

// Widget Components
export { DocumentPrintButton } from './documentPrintButton';
export type { PrintOption } from './documentPrintButton';
export { PatientDetails } from './patientDetails';
export { AllergiesTable } from './allergies';
export { AppointmentsTable } from './appointments';
export { ConditionsTable } from './conditions';
export { DiagnosesTable } from './diagnoses';
export { MedicationsTable } from './medications';
export { RadiologyInvestigationTable } from './radiologyInvestigation';
export { RadiologyInvestigationReport } from './radiologyInvestigationReport';
export { ObservationsRenderer } from './observationsRenderer';
export { LabInvestigation } from './labinvestigation';
export { SearchPatient } from './searchPatient';
export { VitalFlowSheet } from './vitalFlowSheet';
export { GenericServiceRequestTable } from './genericServiceRequest';
export { TaskList } from './tasks';
export { PatientProgramsTable } from './patientPrograms';
export { ImmunizationHistory } from './immunizationHistory';
export { ProgramDetails } from './programDetails';

export {
  CommandPaletteProvider,
  useCommandPalette,
  type CommandPaletteContextType,
  type AnnotationSearchType,
  type NavItem,
  type PatientAction,
  type PatientActionContext,
  type PatientFieldKey,
  type PatientFieldsConfig,
  type SearchAnnotation,
  type TriggerConfig,
} from './commandPalette';

// Notification System
export {
  useNotification,
  NotificationProvider,
  NotificationServiceComponent,
} from './notification';

// Hooks
export { useDebounce } from './commandPalette/useDebounce';
export { usePatientUUID } from './hooks/usePatientUUID';
export { useUserPrivilege } from './userPrivileges/useUserPrivilege';
export { useHasPrivilege } from './userPrivileges/useHasPrivilege';

// User Privileges
export { UserPrivilegeProvider } from './userPrivileges/UserPrivilegeProvider';
export { CONSULTATION_PAD_PRIVILEGES } from './userPrivileges/consultationPadPrivileges';
export { GET_PATIENT_PHOTO_PRIVILEGE } from './userPrivileges/patientPhotoPrivileges';

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

// Location
export {
  LocationContext,
  useLocation,
  LocationProvider,
  LocationSelector,
} from './location';
