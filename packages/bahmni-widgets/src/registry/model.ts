import { ComponentType, LazyExoticComponent } from 'react';

export interface WidgetProps {
  config?: unknown;
}
export interface WidgetConfig {
  type: string;
  component: LazyExoticComponent<ComponentType<WidgetProps>>;
}
