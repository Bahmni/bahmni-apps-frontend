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
}
export interface WidgetConfig {
  type: string;
  component: LazyExoticComponent<ComponentType<WidgetProps>>;
}
