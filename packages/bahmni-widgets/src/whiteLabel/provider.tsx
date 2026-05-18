import { applyWhiteLabel } from '@bahmni/design-system';
import { getConfig } from '@bahmni/services';
import React, { ReactNode, useEffect, useMemo } from 'react';
import { createConfigProvider } from '../configProvider';
import { WhiteLabelContext } from './context';
import { useWhiteLabel } from './hook';
import { type WhiteLabelConfig, type WhiteLabelContextType } from './models';
import whiteLabelSchema from './schema.json';

export const WHITE_LABEL_URL =
  '/bahmni_config/openmrs/apps/home/white-label-extension.json';

// Applies resolved white label colours as a CSS side effect once config has loaded.
// Rendered only after InternalWhiteLabelProvider confirms the fetch succeeded.
const WhiteLabelApplier: React.FC = () => {
  const { whiteLabelConfig } = useWhiteLabel();
  useEffect(() => {
    applyWhiteLabel(whiteLabelConfig ?? {});
  }, [whiteLabelConfig]);
  return null;
};

interface WhiteLabelProviderProps {
  children: ReactNode;
  configUrl?: string;
}

export const WhiteLabelProvider: React.FC<WhiteLabelProviderProps> = ({
  children,
  configUrl = WHITE_LABEL_URL,
}) => {
  const InternalProvider = useMemo(
    () =>
      createConfigProvider<WhiteLabelConfig, WhiteLabelContextType>({
        context: WhiteLabelContext,
        queryKey: ['whiteLabel', configUrl],
        queryFn: () => getConfig<WhiteLabelConfig>(configUrl, whiteLabelSchema),
        valueMapper: (whiteLabelConfig, isLoading, error) => ({
          whiteLabelConfig,
          isLoading,
          error,
        }),
        id: 'white-label',
        name: 'White Label',
        displayName: 'InternalWhiteLabelProvider',
      }),
    [configUrl],
  );

  return (
    <InternalProvider>
      <WhiteLabelApplier />
      {children}
    </InternalProvider>
  );
};

WhiteLabelProvider.displayName = 'WhiteLabelProvider';
