import type { ExtensionHandlerProps } from '@bahmni/services';
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const EXTENSION_HANDLERS: Record<
  string,
  LazyExoticComponent<ComponentType<ExtensionHandlerProps>>
> = {
  'org.bahmni.clinical.v2.search': lazy(
    () => import('./extensions/searchHandler'),
  ),
};
