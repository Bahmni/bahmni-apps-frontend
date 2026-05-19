import { ComponentType, LazyExoticComponent } from 'react';

export interface WidgetProps {
  config?: Record<string, unknown>;
  episodeOfCareUuids?: string[];
  encounterUuids?: string[];
  visitUuids?: string[];
  onEditClick?: () => void;
}
export interface WidgetConfig {
  type: string;
  component: LazyExoticComponent<ComponentType<WidgetProps>>;
}
