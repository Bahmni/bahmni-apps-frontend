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
  readonly use?: string;
  readonly system?: string;
  readonly value: string;
  readonly type?: {
    readonly coding?: {
      readonly system?: string;
      readonly code?: string;
      readonly display?: string;
    };
    readonly text?: string;
  };
}

export interface FhirHumanName {
  readonly use?: string;
  readonly text?: string;
  readonly family?: string;
  readonly given?: ReadonlyArray<string>;
  readonly prefix?: ReadonlyArray<string>;
  readonly suffix?: ReadonlyArray<string>;
}

export interface FhirAddressExtension {
  readonly url: string;
  readonly extension?: ReadonlyArray<{
    readonly url: string;
    readonly valueString?: string;
  }>;
}

export interface FhirAddress {
  readonly use?: string;
  readonly type?: string;
  readonly text?: string;
  readonly line?: ReadonlyArray<string>;
  readonly city?: string;
  readonly district?: string;
  readonly state?: string;
  readonly postalCode?: string;
  readonly country?: string;
  readonly extension?: ReadonlyArray<FhirAddressExtension>;
}

export interface FhirTelecom {
  readonly system?: 'phone' | 'email' | 'other';
  readonly value?: string;
  readonly use?: 'home' | 'work' | 'mobile' | 'temp' | 'old';
}

export interface FhirReference {
  readonly reference?: string;
  readonly display?: string;
}

export interface FhirPatient {
  readonly resourceType: 'Patient';
  readonly id?: string;
  readonly identifier?: ReadonlyArray<FhirIdentifier>;
  readonly active?: boolean;
  readonly name?: ReadonlyArray<FhirHumanName>;
  readonly telecom?: ReadonlyArray<FhirTelecom>;
  readonly gender?: 'male' | 'female' | 'other' | 'unknown';
  readonly birthDate?: string; // YYYY-MM-DD format
  readonly deceasedBoolean?: boolean;
  readonly deceasedDateTime?: string;
  readonly address?: ReadonlyArray<FhirAddress>;
  readonly maritalStatus?: {
    readonly coding?: ReadonlyArray<{
      readonly system?: string;
      readonly code?: string;
      readonly display?: string;
    }>;
  };
  readonly multipleBirthBoolean?: boolean;
  readonly multipleBirthInteger?: number;
  readonly photo?: ReadonlyArray<{
    readonly contentType?: string;
    readonly data?: string;
  }>;
  readonly contact?: ReadonlyArray<{
    readonly relationship?: ReadonlyArray<{
      readonly coding?: ReadonlyArray<{
        readonly system?: string;
        readonly code?: string;
        readonly display?: string;
      }>;
    }>;
    readonly name?: FhirHumanName;
    readonly telecom?: ReadonlyArray<FhirTelecom>;
    readonly address?: FhirAddress;
    readonly gender?: 'male' | 'female' | 'other' | 'unknown';
    readonly organization?: FhirReference;
  }>;
  readonly generalPractitioner?: ReadonlyArray<FhirReference>;
  readonly managingOrganization?: FhirReference;
  readonly link?: ReadonlyArray<{
    readonly other: FhirReference;
    readonly type: 'replaced-by' | 'replaces' | 'refer' | 'seealso';
  }>;
}
