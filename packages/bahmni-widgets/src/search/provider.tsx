import { getConfig } from '@bahmni/services';
import React, { ReactNode, useMemo } from 'react';
import { createConfigProvider } from '../configProvider';
import { SearchWidgetConfigContext } from './context';
import {
  SearchWidgetConfig,
  SearchWidgetConfigContextType,
  SearchWidgetProps,
} from './models';
import searchWidgetConfigSchema from './schema.json';

interface SearchWidgetConfigProviderProps {
  configUrl: string;
  children: ReactNode;
}

const SearchWidgetConfigProvider = ({
  configUrl,
  children,
}: SearchWidgetConfigProviderProps) => {
  const Provider = useMemo(
    () =>
      createConfigProvider<SearchWidgetConfig, SearchWidgetConfigContextType>({
        context: SearchWidgetConfigContext,
        queryKey: ['searchWidgetConfig', configUrl],
        queryFn: () =>
          getConfig<SearchWidgetConfig>(configUrl, searchWidgetConfigSchema),
        valueMapper: (searchWidgetConfig, isLoading, error) => ({
          searchWidgetConfig,
          isLoading,
          error,
        }),
        id: 'search-widget-config',
        name: 'Search Widget Config',
        displayName: 'SearchWidgetConfigProvider',
      }),
    [configUrl],
  );

  return <Provider>{children}</Provider>;
};

export default SearchWidgetConfigProvider;

export const withSearchConfig = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>,
): React.ComponentType<SearchWidgetProps> => {
  const WrappedWidget = ({ extensionParams }: SearchWidgetProps) => {
    const configUrl = extensionParams?.configUrl as string | undefined;
    if (!configUrl) return <Component extensionParams={extensionParams} />;
    return (
      <SearchWidgetConfigProvider configUrl={configUrl}>
        <Component extensionParams={extensionParams} />
      </SearchWidgetConfigProvider>
    );
  };
  WrappedWidget.displayName = `WithSearchConfig(${Component.displayName ?? Component.name})`;
  return WrappedWidget;
};
