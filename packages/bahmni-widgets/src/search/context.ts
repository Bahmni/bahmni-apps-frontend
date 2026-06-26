import { createContext, useContext } from 'react';
import { SearchWidgetConfigContextType } from './models';

export const SearchWidgetConfigContext = createContext<
  SearchWidgetConfigContextType | undefined
>(undefined);

export const useSearchWidgetConfig = (): SearchWidgetConfigContextType => {
  const context = useContext(SearchWidgetConfigContext);
  if (!context) {
    throw new Error(
      'useSearchWidgetConfig must be used within a SearchWidgetConfigProvider',
    );
  }
  return context;
};
