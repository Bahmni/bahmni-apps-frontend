import { ComponentType, LazyExoticComponent } from 'react';

export interface WidgetProps {
  config?: Record<string, unknown>;
  encounterIds?: string[];
  visitIds?: string[];
}
export interface WidgetConfig {
  type: string;
  component: LazyExoticComponent<ComponentType<WidgetProps>>;
}
