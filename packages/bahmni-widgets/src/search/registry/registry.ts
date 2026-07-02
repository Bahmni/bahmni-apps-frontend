import React from 'react';
import { SearchWidget } from './models';

const searchWidgetRegistry: SearchWidget[] = [];

export const registerSearchWidget = (entry: {
  key: string;
  component: React.ComponentType;
}): void => {
  searchWidgetRegistry.push({
    key: entry.key,
    component: entry.component,
  });
};

export const getSearchWidget = (key: string): SearchWidget | undefined =>
  searchWidgetRegistry.find((entry) => entry.key === key);

export const clearSearchWidgetRegistry = (): void => {
  searchWidgetRegistry.length = 0;
};
