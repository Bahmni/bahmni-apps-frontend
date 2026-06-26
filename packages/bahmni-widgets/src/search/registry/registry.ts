import {
  clearExtensionWidget,
  registerExtensionWidget,
} from '../../extensions/registry';
import { withSearchConfig } from '../provider';
import { SearchWidget } from './models';

const searchWidgetRegistry: SearchWidget[] = [];

export const registerSearchWidget = (entry: SearchWidget): void => {
  searchWidgetRegistry.push(entry);
  registerExtensionWidget({
    key: entry.key,
    component: withSearchConfig(entry.component),
  });
};

export const getSearchWidget = (key: string): SearchWidget | undefined =>
  searchWidgetRegistry.find((entry) => entry.key === key);

export const clearSearchWidgetRegistry = (): void => {
  searchWidgetRegistry.length = 0;
  clearExtensionWidget();
};
