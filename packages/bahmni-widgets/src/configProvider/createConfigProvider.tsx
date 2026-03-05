import { Loading } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { Context, ReactNode, useMemo, useEffect } from 'react';
import { useNotification } from '../notification/useNotification';

interface CreateConfigProviderOptions<
  TConfig,
  TContextValue extends { isLoading: boolean; error: Error | null },
> {
  context: Context<TContextValue | undefined>;
  queryKey: string[];
  queryFn: () => Promise<TConfig | null>;
  valueMapper: (
    data: TConfig | null | undefined,
    isLoading: boolean,
    error: Error | null,
  ) => TContextValue;
  namePrefix: string;
  displayName: string;
}

export function createConfigProvider<
  TConfig,
  TContextValue extends { isLoading: boolean; error: Error | null },
>(
  options: CreateConfigProviderOptions<TConfig, TContextValue>,
): React.FC<{ children: ReactNode }> {
  const {
    context: ConfigContext,
    queryKey,
    queryFn,
    valueMapper,
    namePrefix,
    displayName,
  } = options;

  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const { addNotification } = useNotification();

    const { data, isLoading, error } = useQuery({ queryKey, queryFn });

    const value = useMemo(
      () => valueMapper(data, isLoading, error),
      [data, isLoading, error],
    );

    useEffect(() => {
      if (error) {
        addNotification({
          type: 'error',
          title: t('ERROR_CONFIG_TITLE'),
          message: error.message,
        });
      }
    }, [error]);

    if (error) {
      return (
        <div
          id={`${namePrefix}-error`}
          data-testid={`${namePrefix}-error-test-id`}
        />
      );
    }

    if (isLoading) {
      return (
        <Loading
          id={`${namePrefix}-loader`}
          testId={`${namePrefix}-loader-test-id`}
          role="status"
        />
      );
    }

    return (
      <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
    );
  };

  Provider.displayName = displayName;
  return Provider;
}
