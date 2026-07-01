import { CommonSearchWidgetConfig } from '../../models';

export const mockCommonSearchWidgetConfig: CommonSearchWidgetConfig = {
  searchFields: ['name', 'identifier'],
  maxResults: 20,
  placeholder: 'Search by name or ID',
  minCharacters: 3,
};
