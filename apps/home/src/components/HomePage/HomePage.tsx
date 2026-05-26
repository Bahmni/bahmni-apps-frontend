import React from 'react';
import { HomePageGrid } from '../HomePageGrid';
import { HomePageHeader } from '../HomePageHeader';
import styles from './styles/HomePage.module.scss';

export const HomePage: React.FC = () => (
  <>
    <HomePageHeader />
    <main className={styles.homePageBody}>
      <HomePageGrid />
    </main>
  </>
);
