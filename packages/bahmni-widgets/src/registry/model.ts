import { Encounter } from 'fhir/r4';
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
  /** Full active encounter resource from the encounter session store. */
  activeEncounter?: Encounter | null;
  /** True when the active encounter is the clinician's own resumable (MATCHED) encounter. */
  activeEncounterMatched?: boolean;
}
export interface WidgetConfig {
  type: string;
  component: LazyExoticComponent<ComponentType<WidgetProps>>;
}
