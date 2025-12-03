import { EocReferecneType } from '@bahmni/services';
import { ComponentType, LazyExoticComponent } from 'react';

export interface WidgetProps {
  config?: Record<string, unknown>;
  eocReferecne?: EocReferecneType | null;
}
export interface WidgetConfig {
  type: string;
  component: LazyExoticComponent<ComponentType<WidgetProps>>;
}
