/**
 * Represents a Forms encounter response from the REST API
 */
export interface FormsEncounter {
  encounterUuid: string;
  encounterDateTime: number;
  encounterType: string;
  visitUuid?: string;
  visitType?: string;
  providers?: Array<{
    uuid: string;
    name: string;
    encounterRoleUuid: string;
  }>;
  observations?: Array<{
    uuid: string;
    concept: {
      uuid: string;
      name: string;
      dataType?: string;
    };
    value?: unknown;
    groupMembers?: unknown[];
    observationDateTime?: string;
    voided?: boolean;
  }>;
  orders?: unknown[];
  extensions?: Record<string, unknown>;
  [key: string]: unknown;
}
