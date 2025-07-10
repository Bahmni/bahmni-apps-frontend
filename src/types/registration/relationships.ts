/**
 * TypeScript interfaces for Patient Relationships
 * Following OpenMRS REST API patterns
 */

// OpenMRS Relationship Type
export interface RelationshipType {
  readonly uuid: string;
  readonly display: string;
  readonly aIsToB: string;
  readonly bIsToA: string;
  readonly description?: string;
  readonly weight?: number;
  readonly preferred: boolean;
  readonly retired: boolean;
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// OpenMRS Relationship
export interface Relationship {
  readonly uuid: string;
  readonly display: string;
  readonly personA: {
    readonly uuid: string;
    readonly display: string;
    readonly gender: 'M' | 'F' | 'O';
    readonly age?: number;
    readonly birthdate?: string;
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
      readonly cityVillage?: string;
      readonly stateProvince?: string;
      readonly country?: string;
      readonly preferred: boolean;
    }>;
  };
  readonly personB: {
    readonly uuid: string;
    readonly display: string;
    readonly gender: 'M' | 'F' | 'O';
    readonly age?: number;
    readonly birthdate?: string;
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
      readonly cityVillage?: string;
      readonly stateProvince?: string;
      readonly country?: string;
      readonly preferred: boolean;
    }>;
  };
  readonly relationshipType: RelationshipType;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly voided: boolean;
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// Create Relationship Request
export interface CreateRelationshipRequest {
  readonly personA: string; // UUID
  readonly personB: string; // UUID
  readonly relationshipType: string; // UUID
  readonly startDate?: string;
  readonly endDate?: string;
}

// Update Relationship Request
export interface UpdateRelationshipRequest {
  readonly personA?: string; // UUID
  readonly personB?: string; // UUID
  readonly relationshipType?: string; // UUID
  readonly startDate?: string;
  readonly endDate?: string;
  readonly voided?: boolean;
}

// Relationship Form Data
export interface RelationshipFormData {
  readonly relatedPersonUuid: string;
  readonly relationshipTypeUuid: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly isPersonA: boolean; // true if current patient is personA, false if personB
}

// Relationship Search Criteria
export interface RelationshipSearchCriteria {
  readonly person?: string; // UUID
  readonly relationshipType?: string; // UUID
  readonly includeVoided?: boolean;
  readonly limit?: number;
  readonly startIndex?: number;
}

// Relationship Search Response
export interface RelationshipSearchResponse {
  readonly results: ReadonlyArray<Relationship>;
  readonly totalCount: number;
  readonly hasMore: boolean;
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// Relationship Validation State
export interface RelationshipValidationState {
  readonly errors: Record<string, string>;
  readonly touched: Record<string, boolean>;
  readonly isValid: boolean;
  readonly isDirty: boolean;
}

// Relationship Display Options
export interface RelationshipDisplayOptions {
  readonly showStartDate: boolean;
  readonly showEndDate: boolean;
  readonly showAddress: boolean;
  readonly showAge: boolean;
  readonly dateFormat: string;
}

// Relationship Summary (for display purposes)
export interface RelationshipSummary {
  readonly uuid: string;
  readonly relationshipLabel: string; // e.g., "Father", "Mother", "Child"
  readonly relatedPersonName: string;
  readonly relatedPersonUuid: string;
  readonly relatedPersonGender: 'M' | 'F' | 'O';
  readonly relatedPersonAge?: number;
  readonly relatedPersonIdentifier?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly isActive: boolean;
}
