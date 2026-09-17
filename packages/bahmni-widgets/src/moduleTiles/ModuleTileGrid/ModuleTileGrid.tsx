import { InlineNotification, SkeletonPlaceholder } from '@bahmni/design-system';
import {
  type Module,
  getVisibleModules,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import { AppTile } from '../AppTile';
import { MODULE_TILES_SKELETON_COUNT } from '../constants';
import styles from './styles/ModuleTileGrid.module.scss';

interface ModuleTileGridProps {
  /** Extension point to read tiles from, e.g. `org.bahmni.home.dashboard`. */
  extensionPointId: string;
  /** Config app directory under `/bahmni_config/openmrs/apps`. */
  appName?: string;
  /** i18n keys, supplied by the host app so each app owns its own namespace. */
  loadingLabelKey: string;
  errorMessageKey: string;
  emptyMessageKey: string;
  /** Lets the host control outer spacing (e.g. offsetting a fixed header). */
  className?: string;
  testId?: string;
}

/**
 * Renders the config-driven module tiles for an extension point.
 *
 * Shared by the home dashboard and the admin dashboard: both read
 * `extension.json` from deployment config, filter by the user's privileges,
 * and render the same tile design. The extension point and the config app
 * are the only things that differ.
 */
export const ModuleTileGrid: React.FC<ModuleTileGridProps> = ({
  extensionPointId,
  appName = 'home',
  loadingLabelKey,
  errorMessageKey,
  emptyMessageKey,
  className,
  testId = 'module-tile-grid',
}) => {
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
    // appName and extensionPointId are both part of the key so the home and
    // admin grids never serve each other's cached tiles.
    queryKey: ['module-tiles', appName, extensionPointId, privilegeNames],
    queryFn: () =>
      getVisibleModules(extensionPointId, privilegeNames!, appName),
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
        className={[styles.container, className].filter(Boolean).join(' ')}
        data-testid={`${testId}-loading-test-id`}
        role="status"
        aria-label={t(loadingLabelKey)}
        aria-busy="true"
      >
        <div className={styles.tileGrid}>
          {Array.from(
            { length: MODULE_TILES_SKELETON_COUNT },
            (_, i) => `skeleton-${i}`,
          ).map((key) => (
            <SkeletonPlaceholder key={key} className={styles.skeletonTile} />
          ))}
        </div>
      </div>
    );
  }

  if (privilegeError || isError) {
    return (
      <div
        className={[styles.errorContainer, className].filter(Boolean).join(' ')}
        data-testid={`${testId}-error-test-id`}
        role="alert"
      >
        <InlineNotification
          kind="error"
          lowContrast
          subtitle={t(errorMessageKey)}
          hideCloseButton={false}
          onClose={() => void refetch()}
        />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div
        className={styles.emptyState}
        data-testid={`${testId}-empty-test-id`}
        role="status"
      >
        {t(emptyMessageKey)}
      </div>
    );
  }

  return (
    <div
      className={[styles.container, className].filter(Boolean).join(' ')}
      data-testid={`${testId}-test-id`}
    >
      <div className={styles.tileGrid}>
        {modules.map((module: Module) => (
          <AppTile
            key={module.id}
            id={module.id}
            label={module.translationKey ?? module.label}
            icon={module.icon}
            url={module.url}
          />
        ))}
      </div>
    </div>
  );
};
