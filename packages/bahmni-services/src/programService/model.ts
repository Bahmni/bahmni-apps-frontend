export interface Patient {
  uuid: string;
  display: string;
  identifiers?: Array<{
    uuid: string;
    display: string;
  }>;
}

export interface BaseResource {
  uuid: string;
  display: string;
  links?: Array<{
    rel: string;
    uri: string;
    resourceAlias?: string;
  }>;
  resourceVersion?: string;
}

export interface ConceptName extends BaseResource {
  name: string;
  locale: string;
  localePreferred: boolean;
  conceptNameType: string;
}

export interface Concept extends BaseResource {
  names?: ConceptName[];
  datatype?: {
    uuid: string;
    display: string;
  };
  conceptClass?: {
    uuid: string;
    display: string;
  };
  set?: boolean;
  version?: string | null;
  retired?: boolean;
  descriptions?: Array<{
    uuid: string;
    display: string;
  }>;
  mappings?: Array<{
    uuid: string;
    display: string;
  }>;
  answers?: Concept[];
  setMembers?: Concept[];
  attributes?: unknown[];
}

export interface ProgramAttributeType extends BaseResource {
  description: string;
  retired: boolean;
  format: string;
  excludeFrom?: string[];
}

export interface ProgramEnrollmentAttribute extends BaseResource {
  attributeType: ProgramAttributeType;
  value: string | Concept;
  voided?: boolean;
}

export interface AuditInfo {
  creator?: {
    uuid: string;
    display: string;
  };
  dateCreated?: string;
  changedBy?: {
    uuid: string;
    display: string;
  } | null;
  dateChanged?: string | null;
}

export interface ProgramEnrollmentState {
  uuid: string;
  startDate: string;
  endDate: string | null;
  voided?: boolean;
  state: BaseResource & {
    concept: Concept;
    retired?: boolean;
  };
  auditInfo?: AuditInfo;
  links?: Array<{
    rel: string;
    uri: string;
    resourceAlias?: string;
  }>;
  resourceVersion?: string;
}

export interface Program extends BaseResource {
  name: string;
  description?: string;
  retired?: boolean;
  concept?: Concept;
  allWorkflows?: Array<{
    uuid: string;
    concept: Concept;
    description?: string;
    retired?: boolean;
    states?: ProgramEnrollmentState[];
    links?: Array<{
      rel: string;
      uri: string;
      resourceAlias?: string;
    }>;
    resourceVersion?: string;
  }>;
  outcomesConcept?: Concept;
}

export interface ProgramEnrollment extends BaseResource {
  patient: Patient;
  program: Program;
  dateEnrolled: string;
  dateCompleted: string | null;
  dateEnded?: string | null;
  location?: {
    uuid: string;
    display: string;
  } | null;
  voided?: boolean;
  outcome?: Concept | null;
  states: ProgramEnrollmentState[];
  attributes: ProgramEnrollmentAttribute[];
  episodeUuid?: string;
  auditInfo?: AuditInfo;
}

export interface ProgramServiceResponse {
  activePrograms: ProgramEnrollment[];
  endedPrograms: ProgramEnrollment[];
}

export interface ProgramEnrollmentApiResponse {
  results: ProgramEnrollment[];
}
