import {
  Header as CarbonHeader,
  HeaderGlobalBar,
  HeaderName,
} from '@carbon/react';
import React from 'react';
import { LocationSelector } from '../LocationSelector';
import { UserProfileMenu } from '../UserProfileMenu';
import styles from './styles/HomePageHeader.module.scss';

export const HomePageHeader: React.FC = () => (
  <CarbonHeader
    aria-label="Bahmni"
    data-testid="home-page-header"
    className={styles.header}
  >
    <HeaderName href="/" prefix="Home" />
    <HeaderGlobalBar>
      <div className={styles.locationSelector}>
        <LocationSelector />
      </div>
      <div className={styles.userMenu}>
        <UserProfileMenu />
      </div>
    </HeaderGlobalBar>
  </CarbonHeader>
);
