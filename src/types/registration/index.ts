/**
 * Core TypeScript interfaces for the Registration Module
 * Following OpenMRS REST API and FHIR R4 compatibility patterns
 */

// OpenMRS Patient Identifier Type
export interface PatientIdentifierType {
  readonly uuid: string;
  readonly name: string;
  readonly description?: string;
  readonly format?: string;
  readonly required: boolean;
  readonly formatDescription?: string;
  readonly retired: boolean;
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// OpenMRS Person Attribute Type
export interface PersonAttributeType {
  readonly uuid: string;
  readonly name: string;
  readonly description?: string;
  readonly format: string;
  readonly required: boolean;
  readonly searchable: boolean;
  readonly retired: boolean;
  readonly concept?: {
    readonly uuid: string;
    readonly display: string;
  };
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// OpenMRS Address Level (for address hierarchy)
export interface AddressLevel {
  readonly uuid: string;
  readonly name: string;
  readonly level: number;
  readonly parent?: string;
  readonly children?: ReadonlyArray<AddressLevel>;
}

// OpenMRS Patient Identifier
export interface PatientIdentifier {
  readonly uuid?: string;
  readonly identifier: string;
  readonly identifierType: {
    readonly uuid: string;
    readonly name: string;
    readonly display: string;
  };
  readonly location?: {
    readonly uuid: string;
    readonly display: string;
  };
  readonly preferred: boolean;
  readonly voided: boolean;
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// OpenMRS Person Attribute
export interface PersonAttribute {
  readonly uuid?: string;
  readonly value: string;
  readonly attributeType: {
    readonly uuid: string;
    readonly name: string;
    readonly display: string;
  };
  readonly voided: boolean;
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// OpenMRS Person Name
export interface PersonName {
  readonly uuid?: string;
  readonly display?: string;
  readonly givenName?: string;
  readonly middleName?: string;
  readonly familyName?: string;
  readonly familyName2?: string;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly preferred: boolean;
  readonly voided: boolean;
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// OpenMRS Person Address
export interface PersonAddress {
  readonly uuid?: string;
  readonly display?: string;
  readonly address1?: string;
  readonly address2?: string;
  readonly cityVillage?: string;
  readonly stateProvince?: string;
  readonly country?: string;
  readonly postalCode?: string;
  readonly countyDistrict?: string;
  readonly address3?: string;
  readonly address4?: string;
  readonly address5?: string;
  readonly address6?: string;
  readonly preferred: boolean;
  readonly voided: boolean;
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// OpenMRS Audit Info
export interface AuditInfo {
  readonly creator: {
    readonly uuid: string;
    readonly display: string;
  };
  readonly dateCreated: string;
  readonly changedBy?: {
    readonly uuid: string;
    readonly display: string;
  };
  readonly dateChanged?: string;
}

// OpenMRS Person
export interface Person {
  readonly uuid: string;
  readonly display: string;
  readonly gender: 'M' | 'F' | 'O';
  readonly age?: number;
  readonly birthdate?: string;
  readonly birthdateEstimated: boolean;
  readonly dead: boolean;
  readonly deathDate?: string;
  readonly causeOfDeath?: {
    readonly uuid: string;
    readonly display: string;
  };
  readonly names: ReadonlyArray<PersonName>;
  readonly addresses: ReadonlyArray<PersonAddress>;
  readonly attributes: ReadonlyArray<PersonAttribute>;
  readonly voided: boolean;
  readonly auditInfo: AuditInfo;
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// OpenMRS Patient
export interface OpenMRSPatient {
  readonly uuid: string;
  readonly display: string;
  readonly identifiers: ReadonlyArray<PatientIdentifier>;
  readonly person: Person;
  readonly voided: boolean;
  readonly auditInfo: AuditInfo;
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// Patient Search Result
export interface PatientSearchResult {
  readonly uuid: string;
  readonly display: string;
  readonly identifiers: ReadonlyArray<{
    readonly uuid: string;
    readonly identifier: string;
    readonly identifierType: {
      readonly uuid: string;
      readonly name: string;
      readonly display: string;
    };
    readonly preferred: boolean;
  }>;
  readonly person: {
    readonly uuid: string;
    readonly display: string;
    readonly gender: 'M' | 'F' | 'O';
    readonly age?: number;
    readonly birthdate?: string;
    readonly birthdateEstimated: boolean;
    readonly names: ReadonlyArray<{
      readonly uuid: string;
      readonly display: string;
      readonly givenName?: string;
      readonly middleName?: string;
      readonly familyName?: string;
      readonly preferred: boolean;
    }>;
    readonly addresses: ReadonlyArray<{
      readonly uuid: string;
      readonly display: string;
      readonly address1?: string;
      readonly address2?: string;
      readonly cityVillage?: string;
      readonly stateProvince?: string;
      readonly country?: string;
      readonly postalCode?: string;
      readonly preferred: boolean;
    }>;
  };
  readonly voided: boolean;
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// Patient Search Criteria
export interface PatientSearchCriteria {
  name?: string;
  identifier?: string;
  givenName?: string;
  middleName?: string;
  familyName?: string;
  gender?: 'M' | 'F' | 'O';
  birthdate?: string;
  age?: number;
  includeAll?: boolean;
  limit?: number;
  startIndex?: number;
}

// Patient Form Data (for creation/editing)
export interface PatientFormData {
  // Personal Information
  readonly givenName: string;
  readonly middleName?: string;
  readonly familyName: string;
  readonly gender: 'M' | 'F' | 'O';
  readonly birthdate?: string;
  readonly age?: number;
  readonly birthdateEstimated: boolean;

  // Identifiers
  readonly identifiers: ReadonlyArray<{
    readonly identifier: string;
    readonly identifierType: string; // UUID
    readonly location?: string; // UUID
    readonly preferred: boolean;
  }>;

  // Address
  readonly address?: {
    readonly address1?: string;
    readonly address2?: string;
    readonly cityVillage?: string;
    readonly stateProvince?: string;
    readonly country?: string;
    readonly postalCode?: string;
    readonly countyDistrict?: string;
    readonly preferred: boolean;
  };

  // Person Attributes
  readonly attributes: ReadonlyArray<{
    readonly attributeType: string; // UUID
    readonly value: string;
  }>;

  // Photo
  readonly photo?: {
    readonly base64: string;
    readonly filename: string;
    readonly size: number;
    readonly type: string;
    readonly dimensions?: {
      readonly width: number;
      readonly height: number;
    };
  };
}

// Create Patient Request
export interface CreatePatientRequest {
  readonly identifiers: ReadonlyArray<{
    readonly identifier: string;
    readonly identifierType: string;
    readonly location?: string;
    readonly preferred: boolean;
  }>;
  readonly person: {
    readonly names: ReadonlyArray<{
      readonly givenName: string;
      readonly middleName?: string;
      readonly familyName: string;
      readonly preferred: boolean;
    }>;
    readonly gender: 'M' | 'F' | 'O';
    readonly birthdate?: string;
    readonly age?: number;
    readonly birthdateEstimated: boolean;
    readonly addresses?: ReadonlyArray<{
      readonly address1?: string;
      readonly address2?: string;
      readonly cityVillage?: string;
      readonly stateProvince?: string;
      readonly country?: string;
      readonly postalCode?: string;
      readonly countyDistrict?: string;
      readonly preferred: boolean;
    }>;
    readonly attributes?: ReadonlyArray<{
      readonly attributeType: string;
      readonly value: string;
    }>;
  };
}

// Update Patient Request
export interface UpdatePatientRequest {
  readonly identifiers?: ReadonlyArray<{
    readonly uuid?: string;
    readonly identifier: string;
    readonly identifierType: string;
    readonly location?: string;
    readonly preferred: boolean;
    readonly voided?: boolean;
  }>;
  readonly person?: {
    readonly names?: ReadonlyArray<{
      readonly uuid?: string;
      readonly givenName: string;
      readonly middleName?: string;
      readonly familyName: string;
      readonly preferred: boolean;
      readonly voided?: boolean;
    }>;
    readonly gender?: 'M' | 'F' | 'O';
    readonly birthdate?: string;
    readonly age?: number;
    readonly birthdateEstimated?: boolean;
    readonly addresses?: ReadonlyArray<{
      readonly uuid?: string;
      readonly address1?: string;
      readonly address2?: string;
      readonly cityVillage?: string;
      readonly stateProvince?: string;
      readonly country?: string;
      readonly postalCode?: string;
      readonly countyDistrict?: string;
      readonly preferred: boolean;
      readonly voided?: boolean;
    }>;
    readonly attributes?: ReadonlyArray<{
      readonly uuid?: string;
      readonly attributeType: string;
      readonly value: string;
      readonly voided?: boolean;
    }>;
  };
}

// Form Validation State
export interface FormValidationState {
  readonly errors: Record<string, string>;
  readonly touched: Record<string, boolean>;
  readonly isValid: boolean;
  readonly isDirty: boolean;
}

// Patient Search Response
export interface PatientSearchResponse {
  readonly results: ReadonlyArray<PatientSearchResult>;
  readonly totalCount: number;
  readonly hasMore: boolean;
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// API Response wrapper
export interface ApiResponse<T> {
  readonly data: T;
  readonly success: boolean;
  readonly message?: string;
  readonly errors?: ReadonlyArray<string>;
}

// Error Response
export interface ErrorResponse {
  readonly error: {
    readonly message: string;
    readonly code?: string;
    readonly detail?: string;
    readonly globalErrors?: ReadonlyArray<string>;
    readonly fieldErrors?: Record<string, ReadonlyArray<string>>;
  };
}
