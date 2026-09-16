import { useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ACCESS_DENIED_NOTIFICATION_TIMEOUT_MS } from '../../constants/app';
import { HomePageGrid } from '../HomePageGrid';
import { HomePageHeader } from '../HomePageHeader';
import styles from './styles/HomePage.module.scss';

interface AccessDeniedState {
  accessDenied?: { app?: string };
}

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { state } = useLocation();
  const accessDenied = (state as AccessDeniedState | null)?.accessDenied;
  const hasNotifiedRef = useRef(false);

  // An app's privilege guard redirects here and hands off the message, because
  // NotificationProvider is scoped per app and cannot outlive that navigation.
  useEffect(() => {
    if (!accessDenied || hasNotifiedRef.current) {
      return;
    }

    hasNotifiedRef.current = true;
    addNotification({
      title: t('HOME_ACCESS_DENIED_TITLE'),
      message: t('HOME_ACCESS_DENIED_MESSAGE', { app: accessDenied.app ?? '' }),
      type: 'error',
      timeout: ACCESS_DENIED_NOTIFICATION_TIMEOUT_MS,
    });
  }, [accessDenied, addNotification, t]);

  return (
    <>
      <HomePageHeader />
      <main className={styles.homePageBody}>
        <HomePageGrid />
      </main>
    </>
  );
};
