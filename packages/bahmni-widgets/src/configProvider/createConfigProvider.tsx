import { Column, Grid, Loading } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { Context, ReactNode, useMemo, useEffect } from 'react';
import { useNotification } from '../notification/useNotification';
import styles from './styles/configProvider.module.scss';

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
  id: string;
  name: string;
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
    id,
    name,
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
          title: t('ERROR_CONFIG_TITLE', { config: name }),
          message: error.message,
        });
      }
    }, [error]);

    if (error) {
      return (
        <Grid
          id={`${id}-error`}
          data-testid={`${id}-error-test-id`}
          aria-label={t('ERROR_CONFIG_TITLE', { config: name })}
          className={styles.emptyState}
        >
          <Column
            sm={4}
            md={8}
            lg={16}
            xlg={16}
            className={styles.emptyStateTitle}
          >
            {t('ERROR_CONFIG_TITLE', { config: name })}
          </Column>
          <Column
            sm={4}
            md={8}
            lg={16}
            xlg={16}
            className={styles.emptyStateBody}
          >
            {t('ERROR_CONFIG_GENERIC_MESSAGE', { config: name })}
          </Column>
        </Grid>
      );
    }

    if (isLoading) {
      return (
        <Loading
          id={`${id}-loader`}
          testId={`${id}-loader-test-id`}
          aria-label={`${id}-loader-aria-label`}
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
