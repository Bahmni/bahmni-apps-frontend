import type { AuditInfo } from './index';

/**
 * Patient history entry representing a change to patient data
 */
export interface PatientHistoryEntry {
  /** Unique identifier */
  uuid: string;
  /** Type of change (CREATE, UPDATE, DELETE, VOID) */
  changeType: HistoryChangeType;
  /** The patient UUID this change relates to */
  patientUuid: string;
  /** Description of what was changed */
  description: string;
  /** Detailed changes made */
  changes: PatientChanges;
  /** User who made the change */
  user: {
    uuid: string;
    display: string;
    username?: string;
  };
  /** Date and time of the change */
  dateChanged: string;
  /** Reason for the change (optional) */
  reason?: string;
  /** Source of the change (WEB, API, SYNC, etc.) */
  source?: string;
  /** Audit information */
  auditInfo: AuditInfo;
}

/**
 * Types of changes that can be made to patient data
 */
export type HistoryChangeType = 'CREATE' | 'UPDATE' | 'DELETE' | 'VOID' | 'UNVOID';

/**
 * Filter options for history change types
 */
export type HistoryFilter = HistoryChangeType | 'ALL';

/**
 * Detailed information about what changed in patient data
 */
export interface PatientChanges {
  /** Changes to demographics */
  demographics?: {
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }[];
  /** Changes to identifiers */
  identifiers?: {
    action: 'ADDED' | 'REMOVED' | 'MODIFIED';
    identifierType: string;
    oldValue?: string;
    newValue?: string;
  }[];
  /** Changes to addresses */
  addresses?: {
    action: 'ADDED' | 'REMOVED' | 'MODIFIED';
    addressType: string;
    oldValue?: string;
    newValue?: string;
  }[];
  /** Changes to person attributes */
  attributes?: {
    action: 'ADDED' | 'REMOVED' | 'MODIFIED';
    attributeType: string;
    oldValue?: string;
    newValue?: string;
  }[];
  /** Changes to relationships */
  relationships?: {
    action: 'ADDED' | 'REMOVED' | 'MODIFIED';
    relationshipType: string;
    relatedPerson: string;
    oldValue?: string;
    newValue?: string;
  }[];
  /** Other changes not covered above */
  other?: {
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }[];
}

/**
 * Search criteria for patient history
 */
export interface HistorySearchCriteria {
  /** Patient UUID to search history for */
  patientUuid: string;
  /** Filter by change type */
  changeType?: HistoryFilter;
  /** Start date for filtering */
  startDate?: string;
  /** End date for filtering */
  endDate?: string;
  /** User who made the changes */
  userId?: string;
  /** Limit for pagination */
  limit?: number;
  /** Start index for pagination */
  startIndex?: number;
}

/**
 * Response from history search operations
 */
export interface HistorySearchResponse {
  /** Array of history entries */
  results: ReadonlyArray<PatientHistoryEntry>;
  /** Total count of history entries */
  totalCount: number;
  /** Whether there are more results */
  hasMore: boolean;
  /** Pagination links */
  links?: ReadonlyArray<{
    readonly rel: string;
    readonly uri: string;
  }>;
}

/**
 * Export request for patient history
 */
export interface HistoryExportRequest {
  /** Patient UUID */
  patientUuid: string;
  /** Export options */
  options: HistoryExportOptions;
  /** Filter criteria */
  filter?: HistorySearchCriteria;
}

/**
 * Options for history export
 */
export interface HistoryExportOptions {
  /** Export format */
  format: HistoryExportFormat;
  /** Include detailed changes */
  includeDetails?: boolean;
  /** Date format for export */
  dateFormat?: string;
  /** Fields to include in export */
  fields?: string[];
}

/**
 * Supported export formats for history
 */
export type HistoryExportFormat = 'CSV' | 'PDF' | 'JSON' | 'EXCEL';

/**
 * Response from history export operation
 */
export interface HistoryExportResponse {
  /** URL to download the exported file */
  fileUrl: string;
  /** Name of the exported file */
  fileName: string;
  /** Size of the exported file in bytes */
  fileSize: number;
  /** MIME type of the exported file */
  mimeType: string;
  /** Expiration date of the download link */
  expiresAt: string;
}

/**
 * Options for usePatientHistory hook
 */
export interface PatientHistoryOptions {
  /** Auto-load history on hook initialization */
  autoLoad?: boolean;
  /** Default filter to apply */
  defaultFilter?: HistoryFilter;
  /** Default limit for pagination */
  limit?: number;
  /** Include detailed change information */
  includeDetails?: boolean;
  /** Enable real-time updates */
  enableRealtime?: boolean;
}

/**
 * Statistics about patient history
 */
export interface PatientHistoryStats {
  /** Total number of changes */
  totalChanges: number;
  /** Changes by type */
  changesByType: Record<HistoryChangeType, number>;
  /** Changes by date range */
  changesByDate: {
    date: string;
    count: number;
  }[];
  /** Most active users */
  topUsers: {
    user: string;
    count: number;
  }[];
  /** Most recent change date */
  lastChangeDate?: string;
}
