/**
 * TypeScript interfaces for Patient History Tracking
 * Following OpenMRS REST API patterns
 */

// Patient History Entry
export interface PatientHistoryEntry {
  readonly uuid: string;
  readonly changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'VOID' | 'UNVOID';
  readonly changeDescription: string;
  readonly changedBy: {
    readonly uuid: string;
    readonly display: string;
    readonly username?: string;
  };
  readonly dateChanged: string;
  readonly changes: PatientChanges;
  readonly reason?: string;
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// Patient Changes (what was changed)
export interface PatientChanges {
  readonly demographics?: DemographicChanges;
  readonly identifiers?: IdentifierChanges;
  readonly addresses?: AddressChanges;
  readonly attributes?: AttributeChanges;
  readonly relationships?: RelationshipChanges;
  readonly photo?: PhotoChanges;
}

// Demographic Changes
export interface DemographicChanges {
  readonly names?: ReadonlyArray<NameChange>;
  readonly gender?: FieldChange<'M' | 'F' | 'O'>;
  readonly birthdate?: FieldChange<string>;
  readonly age?: FieldChange<number>;
  readonly birthdateEstimated?: FieldChange<boolean>;
  readonly dead?: FieldChange<boolean>;
  readonly deathDate?: FieldChange<string>;
  readonly causeOfDeath?: FieldChange<string>;
}

// Name Change
export interface NameChange {
  readonly action: 'ADDED' | 'UPDATED' | 'REMOVED';
  readonly givenName?: FieldChange<string>;
  readonly middleName?: FieldChange<string>;
  readonly familyName?: FieldChange<string>;
  readonly preferred?: FieldChange<boolean>;
}

// Identifier Changes
export interface IdentifierChanges {
  readonly identifiers?: ReadonlyArray<IdentifierChange>;
}

// Identifier Change
export interface IdentifierChange {
  readonly action: 'ADDED' | 'UPDATED' | 'REMOVED';
  readonly identifierType: string;
  readonly identifier?: FieldChange<string>;
  readonly location?: FieldChange<string>;
  readonly preferred?: FieldChange<boolean>;
}

// Address Changes
export interface AddressChanges {
  readonly addresses?: ReadonlyArray<AddressChange>;
}

// Address Change
export interface AddressChange {
  readonly action: 'ADDED' | 'UPDATED' | 'REMOVED';
  readonly address1?: FieldChange<string>;
  readonly address2?: FieldChange<string>;
  readonly cityVillage?: FieldChange<string>;
  readonly stateProvince?: FieldChange<string>;
  readonly country?: FieldChange<string>;
  readonly postalCode?: FieldChange<string>;
  readonly countyDistrict?: FieldChange<string>;
  readonly preferred?: FieldChange<boolean>;
}

// Attribute Changes
export interface AttributeChanges {
  readonly attributes?: ReadonlyArray<AttributeChange>;
}

// Attribute Change
export interface AttributeChange {
  readonly action: 'ADDED' | 'UPDATED' | 'REMOVED';
  readonly attributeType: string;
  readonly value?: FieldChange<string>;
}

// Relationship Changes
export interface RelationshipChanges {
  readonly relationships?: ReadonlyArray<RelationshipChange>;
}

// Relationship Change
export interface RelationshipChange {
  readonly action: 'ADDED' | 'UPDATED' | 'REMOVED';
  readonly relationshipType: string;
  readonly relatedPerson: string;
  readonly startDate?: FieldChange<string>;
  readonly endDate?: FieldChange<string>;
}

// Photo Changes
export interface PhotoChanges {
  readonly action: 'ADDED' | 'UPDATED' | 'REMOVED';
  readonly contentType?: string;
  readonly size?: number;
}

// Field Change (generic for tracking old vs new values)
export interface FieldChange<T> {
  readonly oldValue: T | null;
  readonly newValue: T | null;
}

// History Filter Options
export type HistoryFilter =
  | 'ALL'
  | 'DEMOGRAPHICS'
  | 'IDENTIFIERS'
  | 'ADDRESSES'
  | 'ATTRIBUTES'
  | 'RELATIONSHIPS'
  | 'PHOTO';

// History Search Criteria
export interface HistorySearchCriteria {
  readonly patientUuid: string;
  readonly filter?: HistoryFilter;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly changedBy?: string; // UUID
  readonly limit?: number;
  readonly startIndex?: number;
}

// History Search Response
export interface HistorySearchResponse {
  readonly results: ReadonlyArray<PatientHistoryEntry>;
  readonly totalCount: number;
  readonly hasMore: boolean;
  readonly links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

// History Export Options
export interface HistoryExportOptions {
  readonly format: 'CSV' | 'PDF' | 'JSON';
  readonly includeFields: ReadonlyArray<string>;
  readonly dateFormat: string;
  readonly includeUserInfo: boolean;
  readonly includeTimestamp: boolean;
}

// History Export Request
export interface HistoryExportRequest {
  readonly patientUuid: string;
  readonly criteria: HistorySearchCriteria;
  readonly options: HistoryExportOptions;
}

// History Export Response
export interface HistoryExportResponse {
  readonly fileUrl: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly mimeType: string;
  readonly expiresAt: string;
}

// History Statistics
export interface HistoryStatistics {
  readonly totalChanges: number;
  readonly changesByType: Record<string, number>;
  readonly changesByUser: Record<string, number>;
  readonly changesByDate: Record<string, number>;
  readonly mostRecentChange?: string;
  readonly oldestChange?: string;
}

// History Display Options
export interface HistoryDisplayOptions {
  readonly showUserInfo: boolean;
  readonly showTimestamp: boolean;
  readonly showChangeDetails: boolean;
  readonly groupByDate: boolean;
  readonly expandAll: boolean;
  readonly dateFormat: string;
  readonly timeFormat: string;
}

// History Timeline Entry (for timeline view)
export interface HistoryTimelineEntry {
  readonly date: string;
  readonly entries: ReadonlyArray<PatientHistoryEntry>;
  readonly changeCount: number;
  readonly primaryChange?: string;
}
