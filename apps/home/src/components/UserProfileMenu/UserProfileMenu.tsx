import { SkeletonPlaceholder } from '@bahmni/design-system';
import { useTranslation, logout, getFormattedError } from '@bahmni/services';
import { useActivePractitioner, useNotification } from '@bahmni/widgets';
import { UserAvatar } from '@carbon/icons-react';
import { OverflowMenu, OverflowMenuItem } from '@carbon/react';
import axios from 'axios';
import React, { useState } from 'react';
import { LOGIN_PATH, CHANGE_PASSWORD_PATH } from '../../constants/app';
import styles from './styles/UserProfileMenu.module.scss';

export const UserProfileMenu: React.FC = () => {
  const { t } = useTranslation();
  const { user, loading } = useActivePractitioner();
  const { addNotification } = useNotification();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (loading) {
    return (
      <div role="status" aria-label={t('HOME_LOADING')}>
        <SkeletonPlaceholder className={styles.skeleton} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      window.location.href = LOGIN_PATH;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = LOGIN_PATH;
        return;
      }
      const { title, message } = getFormattedError(error);
      addNotification({
        title,
        message,
        type: 'error',
      });
      // eslint-disable-next-line no-console
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={styles.profileContainer}>
      <OverflowMenu
        renderIcon={UserAvatar}
        size="lg"
        flipped
        iconDescription={t('HOME_USER_MENU')}
        data-testid="user-profile-menu"
        menuOptionsClass={styles.menuOptions}
      >
        <OverflowMenuItem
          itemText={t('HOME_CHANGE_PASSWORD')}
          onClick={() => {
            window.location.href = CHANGE_PASSWORD_PATH;
          }}
          data-testid="change-password-option"
        />
        <OverflowMenuItem
          itemText={t('HOME_LOGOUT')}
          onClick={handleLogout}
          disabled={isLoggingOut}
          data-testid="logout-option"
          hasDivider
        />
      </OverflowMenu>
      <span className={styles.greeting}>
        {t('HOME_GREETING', { name: user.display })}
      </span>
    </div>
  );
};
