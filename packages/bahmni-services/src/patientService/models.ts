export interface Age {
  years: number;
  months: number;
  days: number;
}

export interface FormattedPatientData {
  id: string;
  fullName: string | null;
  gender: string | null;
  birthDate: string | null;
  formattedAddress: string | null;
  formattedContact: string | null;
  identifiers: Map<string, string>;
  age: Age | null;
}

export interface PatientSearchResult {
  uuid: string;
  birthDate: Date | string;
  extraIdentifiers: string | null;
  personId: number;
  deathDate: Date | null;
  identifier: string;
  addressFieldValue: string | null;
  patientProgramAttributeValue: string | null;
  givenName: string;
  middleName: string;
  familyName: string;
  gender: string;
  dateCreated: Date;
  activeVisitUuid: string;
  customAttribute: string;
  hasBeenAdmitted: boolean;
  age: string;
}

export interface PatientSearchResultBundle {
  totalCount: number;
  pageOfResults: PatientSearchResult[] | AppointmentSearchResult[];
}

export interface IdentifierSource {
  uuid: string;
  name: string;
  prefix: string;
}

export interface IdentifierType {
  uuid: string;
  name: string;
  description: string;
  format: string | null;
  required: boolean;
  primary: boolean;
  identifierSources: IdentifierSource[];
}

export type IdentifierTypesResponse = IdentifierType[];

export interface AppSetting {
  property: string;
  value: string;
}
export type AppSettingsResponse = AppSetting[];

// Patient Creation Models
export interface PatientName {
  givenName: string;
  middleName?: string;
  familyName: string;
  display?: string;
  preferred?: boolean;
}

export interface PatientAddress {
  address1?: string;
  address2?: string;
  cityVillage?: string;
  countyDistrict?: string;
  stateProvince?: string;
  postalCode?: string;
}

export interface PatientIdentifier {
  identifierSourceUuid?: string;
  identifierPrefix?: string;
  identifierType: string;
  preferred: boolean;
  voided?: boolean;
}

export interface PatientAttribute {
  attributeType: {
    uuid: string;
  };
  voided?: boolean;
  value?: string;
}

export interface CreatePatientRequest {
  patient: {
    person: {
      names: PatientName[];
      gender: string;
      birthdate: string;
      birthdateEstimated?: boolean;
      birthtime?: string | null;
      addresses?: PatientAddress[];
      attributes?: PatientAttribute[];
      deathDate?: string | null;
      causeOfDeath?: string;
    };
    identifiers: PatientIdentifier[];
  };
  relationships?: unknown[];
}

export interface CreatePatientResponse {
  patient: {
    uuid: string;
    display: string;
    person: {
      uuid: string;
      names: Array<{
        display: string;
      }>;
    };
    identifiers: Array<{
      identifier: string;
    }>;
  };
}

export interface AddressHierarchyEntry {
  name: string;
  uuid: string;
  userGeneratedId: string | null;
  level?: string;
  parent?: AddressHierarchyEntry;
}

export interface AddressHierarchyResponse {
  results: AddressHierarchyEntry[];
}

export interface OrderedAddressHierarchyLevel {
  name: string;
  addressField: string;
  required: boolean;
}

export type OrderedAddressHierarchyLevels = OrderedAddressHierarchyLevel[];

export interface VisitType {
  visitTypes: Record<string, string>;
}

export interface VisitData {
  patient: string;
  visitType: string;
  location: string;
}

export interface VisitLocationResponse {
  uuid: string;
}

export interface ActiveVisit {
  results: string[];
}
export interface AppointmentSearchResult extends PatientSearchResult {
  appointmentNumber?: string;
  appointmentDate?: string;
  appointmentReason?: string;
  appointmentStatus?: string;
}
export interface Appointment {
  length: number;
  uuid: string;
  appointmentNumber: string;
  dateCreated: number;
  dateAppointmentScheduled: number;
  patient: Patient;
  service: AppointmentService;
  serviceType: ServiceType | null;
  provider: Provider | null;
  location: Location;
  startDateTime: number;
  endDateTime: number;
  appointmentKind: string;
  status: string;
  comments: string | null;
  additionalInfo: string | null;
  teleconsultation: string | null;
  providers: Provider[];
  reasons: Reason[];
}

export interface Patient {
  identifier: string;
  gender: string;
  name: string;
  uuid: string;
  birthDate: number;
  age: number;
  PatientIdentifier: string;
  customAttributes: [];
}

export interface AppointmentService {
  appointmentServiceId: number;
  name: string;
  description: string | null;
  speciality: null;
  startTime: string;
  endTime: string;
  maxAppointmentsLimit: number;
  durationMins: number | null;
  location: Location;
  uuid: string;
  color: string;
  initialAppointmentStatus: string | null;
  creatorName: string | null;
}

export interface Location {
  name: string;
  uuid: string;
}

export interface Provider {
  id?: number;
  name?: string;
  uuid?: string;
}

export interface Extensions {
  patientEmailDefined: boolean;
}

export interface Reason {
  conceptUuid: string;
  name: string;
}

export interface ServiceType {
  id?: number;
  name?: string;
  description?: string;
  uuid?: string;
}
