import type { AuditInfo, Person } from './index';

/**
 * Relationship between two people in the system
 */
export interface Relationship {
  /** Unique identifier */
  uuid: string;
  /** First person in the relationship */
  personA: Person;
  /** Second person in the relationship */
  personB: Person;
  /** Type of relationship */
  relationshipType: RelationshipType;
  /** Start date of the relationship */
  startDate: string;
  /** End date of the relationship (null if active) */
  endDate: string | null;
  /** Audit information */
  auditInfo: AuditInfo;
}

/**
 * Type of relationship between two people
 */
export interface RelationshipType {
  /** Unique identifier */
  uuid: string;
  /** Display name */
  display: string;
  /** Description */
  description: string;
  /** Label for person A to person B */
  aIsToB: string;
  /** Label for person B to person A */
  bIsToA: string;
  /** Whether this relationship type is retired */
  retired: boolean;
}

/**
 * Request to create a new relationship
 */
export interface CreateRelationshipRequest {
  /** UUID of first person */
  personA: string;
  /** UUID of second person */
  personB: string;
  /** UUID of relationship type */
  relationshipType: string;
  /** Start date of the relationship */
  startDate: string;
  /** End date of the relationship (optional) */
  endDate?: string;
}

/**
 * Request to update an existing relationship
 */
export interface UpdateRelationshipRequest {
  /** UUID of first person (optional) */
  personA?: string;
  /** UUID of second person (optional) */
  personB?: string;
  /** UUID of relationship type (optional) */
  relationshipType?: string;
  /** Start date of the relationship (optional) */
  startDate?: string;
  /** End date of the relationship (optional) */
  endDate?: string;
}

/**
 * Response from relationship search operations
 */
export interface RelationshipSearchResponse {
  /** Array of relationships */
  results: ReadonlyArray<Relationship>;
  /** Total count of relationships */
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
 * Options for relationship operations
 */
export interface RelationshipOptions {
  /** Include inactive relationships */
  includeInactive?: boolean;
  /** Auto-load data on hook initialization */
  autoLoad?: boolean;
  /** Limit for pagination */
  limit?: number;
  /** Start index for pagination */
  startIndex?: number;
}
