import { getConfig } from '@bahmni/services';
import { ReactNode, useMemo } from 'react';
import { createConfigProvider } from '../configProvider';
import { ExtensionConfigContext } from './context';
import { Extension, ExtensionConfigContextType } from './models';
import extensionSchema from './schema.json';

interface ExtensionConfigProviderProps {
  configUrl: string;
  children: ReactNode;
}

const ExtensionConfigProvider = ({
  configUrl,
  children,
}: ExtensionConfigProviderProps) => {
  const Provider = useMemo(
    () =>
      createConfigProvider<Extension[], ExtensionConfigContextType>({
        context: ExtensionConfigContext,
        queryKey: ['extensionConfig', configUrl],
        queryFn: () => getConfig<Extension[]>(configUrl, extensionSchema),
        valueMapper: (extensions, isLoading, error) => ({
          extensions: extensions ?? [],
          isLoading,
          error,
        }),
        id: 'extension-config',
        name: 'Extensions Config',
        displayName: 'ExtensionsConfigProvider',
      }),
    [configUrl],
  );

  return <Provider>{children}</Provider>;
};

export default ExtensionConfigProvider;
