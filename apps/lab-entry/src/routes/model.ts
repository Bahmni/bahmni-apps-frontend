import { ComponentType, LazyExoticComponent } from 'react';

export interface RouteConfig {
  path: string;
  component: LazyExoticComponent<ComponentType<any>>;
  name: string;
}

export type Routes = RouteConfig[];
