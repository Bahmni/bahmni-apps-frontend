import { Header } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { LocationSelector, UserGlobalAction } from '@bahmni/widgets';
import React from 'react';
import styles from './styles/HomePageHeader.module.scss';

export const HomePageHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Header
      ariaLabel="Bahmni"
      brandPrefix={t('HOME_LABEL')}
      brandHref="/"
      globalFeatures={[
        <div key="location" className={styles.locationSelector}>
          <LocationSelector />
        </div>,
      ]}
      userMenu={<UserGlobalAction />}
    />
  );
};
