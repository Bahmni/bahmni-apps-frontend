import { InlineNotification, Grid, Column } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useCallback, useEffect, useState } from 'react';
import { Module, getVisibleModules } from '../../../services/moduleService';
import { AppTile } from '../AppTile';
import styles from './styles/HomePageGrid.module.scss';

export const HomePageGrid: React.FC = () => {
  const { t } = useTranslation();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const visibleModules = await getVisibleModules(
        'org.bahmni.home.dashboard',
      );

      setModules(visibleModules);
    } catch (err) {
      const message = t('HOME_ERROR_FETCH_CONFIG');
      setError(message);
      // eslint-disable-next-line no-console
      console.error('Error loading modules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  if (loading) {
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

  if (error) {
    return (
      <div
        className={styles.errorContainer}
        data-testid="home-error"
        role="alert"
      >
        <InlineNotification
          kind="error"
          lowContrast
          subtitle={error}
          hideCloseButton={false}
          onClose={() => setError(null)}
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
        {modules.map((module) => (
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
              privileges={
                module.requiredPrivilege
                  ? [module.requiredPrivilege]
                  : undefined
              }
            />
          </Column>
        ))}
      </Grid>
    </div>
  );
};
