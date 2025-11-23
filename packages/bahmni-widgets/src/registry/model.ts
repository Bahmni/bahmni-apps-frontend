import { ComponentType, LazyExoticComponent } from 'react';

export interface WidgetConfig {
  type: string;
  component: LazyExoticComponent<ComponentType<object>>;
}
