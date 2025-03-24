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

export interface FhirIdentifier {
  use?: string;
  system?: string;
  value: string;
  type?: {
    coding?: {
      system?: string;
      code?: string;
      display?: string;
    };
    text?: string;
  };
}

export interface FhirHumanName {
  use?: string;
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

export interface FhirAddress {
  use?: string;
  type?: string;
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface FhirTelecom {
  system?: 'phone' | 'email' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'mobile' | 'temp' | 'old';
}

export interface FhirReference {
  reference?: string;
  display?: string;
}

export interface FhirPatient {
  resourceType: 'Patient';
  id?: string;
  identifier?: FhirIdentifier[];
  active?: boolean;
  name?: FhirHumanName[];
  telecom?: FhirTelecom[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string; // YYYY-MM-DD format
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: FhirAddress[];
  maritalStatus?: {
    coding?: [{ system?: string; code?: string; display?: string }];
  };
  multipleBirthBoolean?: boolean;
  multipleBirthInteger?: number;
  photo?: { contentType?: string; data?: string }[];
  contact?: {
    relationship?: [
      { coding?: [{ system?: string; code?: string; display?: string }] },
    ];
    name?: FhirHumanName;
    telecom?: FhirTelecom[];
    address?: FhirAddress;
    gender?: 'male' | 'female' | 'other' | 'unknown';
    organization?: FhirReference;
  }[];
  generalPractitioner?: FhirReference[];
  managingOrganization?: FhirReference;
  link?: {
    other: FhirReference;
    type: 'replaced-by' | 'replaces' | 'refer' | 'seealso';
  }[];
}
