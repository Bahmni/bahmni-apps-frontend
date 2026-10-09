import { ModuleTileGrid } from '@bahmni/widgets';
import React from 'react';
import { HOME_EXTENSION_POINT } from '../../constants/app';
import styles from './styles/HomePageGrid.module.scss';

export const HomePageGrid: React.FC = () => (
  <ModuleTileGrid
    extensionPointId={HOME_EXTENSION_POINT}
    loadingLabelKey="HOME_LOADING_MODULES"
    errorMessageKey="HOME_ERROR_FETCH_CONFIG"
    emptyMessageKey="HOME_NO_MODULES"
    className={styles.headerOffset}
    testId="home-modules"
  />
);
