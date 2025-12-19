interface Link {
  rel: string;
  uri: string;
  resourceAlias?: string;
}

interface BaseResource {
  uuid: string;
  display: string;
  links?: Link[];
  resourceVersion?: string;
}

interface User extends BaseResource {
  links: Link[];
}

interface AuditInfo {
  creator?: User;
  dateCreated?: string;
  changedBy?: User | null;
  dateChanged?: string | null;
}

interface PersonName extends BaseResource {
  links?: Link[];
}

interface PersonAttribute extends BaseResource {
  links?: Link[];
}

interface Person extends BaseResource {
  gender: string;
  age: number;
  birthdate: string;
  birthdateEstimated: boolean;
  dead: boolean;
  deathDate: string | null;
  causeOfDeath: unknown | null;
  preferredName: PersonName;
  preferredAddress: unknown | null;
  attributes: PersonAttribute[];
  voided: boolean;
  birthtime: string | null;
  deathdateEstimated: boolean;
  links: Link[];
  resourceVersion: string;
}

interface PatientIdentifier extends BaseResource {
  links: Link[];
}

interface Patient extends BaseResource {
  identifiers: PatientIdentifier[];
  person: Person;
  voided: boolean;
  links: Link[];
  resourceVersion: string;
}

interface ConceptName extends BaseResource {
  name: string;
  locale: string;
  localePreferred: boolean;
  conceptNameType: string;
  links: Link[];
  resourceVersion: string;
}

interface ConceptDatatype extends BaseResource {
  name?: string;
  description?: string;
  hl7Abbreviation?: string;
  retired: boolean;
  links: Link[];
  resourceVersion: string;
}

interface ConceptClass extends BaseResource {
  name?: string;
  description?: string;
  retired: boolean;
  links: Link[];
  resourceVersion: string;
}

interface ConceptDescription extends BaseResource {
  description?: string;
  locale?: string;
  links?: Link[];
  resourceVersion?: string;
}

interface ConceptMapping extends BaseResource {
  links?: Link[];
}

interface Concept extends BaseResource {
  name?: ConceptName;
  names?: ConceptName[];
  datatype?: ConceptDatatype;
  conceptClass?: ConceptClass;
  set?: boolean;
  version?: string | null;
  retired?: boolean;
  descriptions?: ConceptDescription[];
  mappings?: ConceptMapping[];
  answers?: Concept[];
  setMembers?: Concept[];
  attributes?: unknown[];
  auditInfo?: AuditInfo;
  links: Link[];
  resourceVersion: string;
}

interface ProgramAttributeType extends BaseResource {
  description: string;
  retired: boolean;
  links: Link[];
}

interface ProgramEnrollmentAttribute extends BaseResource {
  attributeType: ProgramAttributeType;
  value: string | Concept;
  voided: boolean;
  links: Link[];
  resourceVersion: string;
}

interface WorkflowState extends BaseResource {
  description?: string | null;
  retired: boolean;
  concept: Concept;
  links: Link[];
  resourceVersion: string;
}

interface ProgramEnrollmentState {
  uuid: string;
  startDate: string;
  endDate: string | null;
  voided: boolean;
  state: WorkflowState;
  auditInfo?: AuditInfo;
}

interface Workflow extends BaseResource {
  concept: Concept;
  description?: string | null;
  retired: boolean;
  states: WorkflowState[];
  links: Link[];
  resourceVersion: string;
}

interface Program extends BaseResource {
  name: string;
  description?: string;
  retired: boolean;
  concept: Concept;
  allWorkflows: Workflow[];
  outcomesConcept?: Concept;
  links: Link[];
  resourceVersion: string;
}

export interface ProgramEnrollment extends BaseResource {
  patient: Patient;
  program: Program;
  dateEnrolled: string;
  dateCompleted: string | null;
  dateEnded?: string | null;
  location: {
    uuid: string;
    display: string;
  } | null;
  voided: boolean;
  outcome: Concept | null;
  states: ProgramEnrollmentState[];
  attributes: ProgramEnrollmentAttribute[];
  episodeUuid: string;
  auditInfo: AuditInfo;
  links: Link[];
  resourceVersion: string;
}

export interface PatientProgramsResponse {
  results: ProgramEnrollment[];
}
