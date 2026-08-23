import type { SearchExtension } from '@bahmni/services';
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const EXTENSION_HANDLERS: Record<
  string,
  LazyExoticComponent<ComponentType<{ extensions: SearchExtension[] }>>
> = {
  'org.bahmni.registration.v2.search': lazy(
    () => import('./extensions/searchView'),
  ),
};
