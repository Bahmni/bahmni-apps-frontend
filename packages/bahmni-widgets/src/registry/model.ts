import { ComponentType, LazyExoticComponent } from 'react';

export interface WidgetActionConfig {
  label: string;
  type: string;
  requiredPrivilege?: string[];
}

export interface WidgetProps {
  config?: Record<string, unknown>;
  episodeOfCareUuids?: string[];
  encounterUuids?: string[];
  visitUuids?: string[];
  onEditClick?: () => void;
  disableActions?: boolean;
  /** Whether the encounter session allows editing/creating resources. */
  canEditOrCreate?: boolean;
  /** UUID of the active encounter (from the encounter session store). */
  activeEncounterUuid?: string | null;
  /** Row-level edit callback — passes the FHIR resource UUID of the row being edited. */
  onRowEditClick?: (resourceId: string) => void;
}
export interface WidgetConfig {
  type: string;
  component: LazyExoticComponent<ComponentType<WidgetProps>>;
}
