import { Header } from '@bahmni/design-system';
import { LocationSelector, UserGlobalAction } from '@bahmni/widgets';
import React from 'react';
import styles from './styles/HomePageHeader.module.scss';

export const HomePageHeader: React.FC = () => (
  <Header
    ariaLabel="Bahmni"
    brandPrefix="Home"
    brandHref="/"
    globalFeatures={[
      <div key="location" className={styles.locationSelector}>
        <LocationSelector />
      </div>,
    ]}
    userMenu={<UserGlobalAction />}
  />
);
