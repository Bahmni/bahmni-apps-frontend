import { InlineNotification, Grid, Column } from '@bahmni/design-system';
import {
  type Module,
  getVisibleModules,
  useTranslation,
} from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { AppTile } from '../AppTile';
import styles from './styles/HomePageGrid.module.scss';

export const HomePageGrid: React.FC = () => {
  const { t } = useTranslation();
  const {
    userPrivileges,
    isLoading: privilegesLoading,
    error: privilegeError,
  } = useUserPrivilege();

  // null = provider hasn't settled yet; [] = user has no privileges
  const privilegeNames = userPrivileges?.map((p) => p.name) ?? null;

  const {
    data: modules = [],
    isLoading: modulesLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['home-modules', privilegeNames],
    queryFn: () =>
      getVisibleModules('org.bahmni.home.dashboard', privilegeNames!),
    enabled:
      !privilegesLoading && privilegeError === null && privilegeNames !== null,
  });

  if (
    privilegesLoading ||
    modulesLoading ||
    (privilegeNames === null && !privilegeError)
  ) {
    return (
      <div
        className={styles.container}
        role="status"
        aria-label={t('HOME_LOADING_MODULES')}
        aria-busy="true"
      >
        <Grid>
          {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((key) => (
            <Column
              key={key}
              lg={5}
              md={4}
              sm={4}
              className={styles.tileColumn}
            >
              <div className={styles.skeletonTile} />
            </Column>
          ))}
        </Grid>
      </div>
    );
  }

  if (privilegeError || isError) {
    return (
      <div
        className={styles.errorContainer}
        data-testid="home-error"
        role="alert"
      >
        <InlineNotification
          kind="error"
          lowContrast
          subtitle={t('HOME_ERROR_FETCH_CONFIG')}
          hideCloseButton={false}
          onClose={() => void refetch()}
        />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        {t('HOME_NO_MODULES')}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Grid>
        {modules.map((module: Module) => (
          <Column
            key={module.id}
            lg={5}
            md={4}
            sm={4}
            className={styles.tileColumn}
          >
            <AppTile
              id={module.id}
              label={module.translationKey ?? module.label}
              icon={module.icon}
              url={module.url}
            />
          </Column>
        ))}
      </Grid>
    </div>
  );
};
