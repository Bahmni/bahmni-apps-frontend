import React from 'react';
import { CONTRIBUTORS, CREDITS_INTRO } from './constants';
import styles from './styles/Credits.module.scss';

export const Credits: React.FC = () => (
  <main className={styles.contributors}>
    <div className={styles.contributorList}>
      <p>{CREDITS_INTRO}</p>
      <p>{CONTRIBUTORS.join(', ')}</p>
    </div>
  </main>
);
