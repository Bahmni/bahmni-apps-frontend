import { type AccessDeniedRouteState, useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ACCESS_DENIED_NOTIFICATION_TIMEOUT_MS } from '../../constants/app';
import { HomePageGrid } from '../HomePageGrid';
import { HomePageHeader } from '../HomePageHeader';
import styles from './styles/HomePage.module.scss';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const { pathname, search, hash, state } = useLocation();
  const accessDenied = (state as AccessDeniedRouteState | null)?.accessDenied;
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
    // Consume the state so revisiting this history entry (e.g. via Back)
    // does not replay a denial that never happened again.
    navigate({ pathname, search, hash }, { replace: true, state: null });
  }, [accessDenied, addNotification, t, navigate, pathname, search, hash]);

  return (
    <>
      <HomePageHeader />
      <main className={styles.homePageBody}>
        <HomePageGrid />
      </main>
    </>
  );
};
