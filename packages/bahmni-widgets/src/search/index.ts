import './commonSearch';

export {
  registerSearchWidget,
  getSearchWidget,
  clearSearchWidgetRegistry,
  type SearchWidget,
} from './registry';

export { default as SearchWidgetConfigProvider } from './provider';
export { useSearchWidgetConfig } from './context';
export type {
  SearchWidgetProps,
  SearchWidgetConfig,
  SearchWidgetConfigContextType,
} from './models';

export { CommonSearchWidget } from './commonSearch';
