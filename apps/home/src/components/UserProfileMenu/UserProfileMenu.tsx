import { SkeletonPlaceholder } from '@bahmni/design-system';
import { useTranslation, logout, getFormattedError } from '@bahmni/services';
import { useActivePractitioner, useNotification } from '@bahmni/widgets';
import { UserAvatar } from '@carbon/icons-react';
import {
  HeaderGlobalAction,
  Menu,
  MenuItem,
  MenuItemDivider,
} from '@carbon/react';
import React, { useRef, useState } from 'react';
import { LOGIN_PATH, CHANGE_PASSWORD_PATH } from '../../constants/app';
import styles from './styles/UserProfileMenu.module.scss';

const MENU_ID = 'user-profile-menu-dropdown';

export const UserProfileMenu: React.FC = () => {
  const { t } = useTranslation();
  const { user, loading } = useActivePractitioner();
  const { addNotification } = useNotification();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    x: [number, number];
    y: [number, number];
  }>({ x: [0, 0], y: [0, 0] });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleTriggerClick = () => {
    if (!isOpen && triggerRef.current) {
      const trigger = triggerRef.current;
      const { left, right } = trigger.getBoundingClientRect();
      // Anchor the menu to the header's bottom edge (not the trigger's, which
      // sits inside the header) so it opens just below the header. x uses the
      // trigger's extent; with menuAlignment="bottom-end" the menu's right edge
      // aligns to the trigger and it drops below the header.
      const header = trigger.closest('.cds--header');
      const anchorBottom = (header ?? trigger).getBoundingClientRect().bottom;
      setMenuPosition({ x: [left, right], y: [anchorBottom, anchorBottom] });
    }
    setIsOpen((open) => !open);
  };

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
      const { title } = getFormattedError(error);
      addNotification({
        title,
        message: t('HOME_ERROR_LOGOUT_FAILED'),
        type: 'error',
      });
      // eslint-disable-next-line no-console
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={styles.profileContainer} ref={triggerRef}>
      <HeaderGlobalAction
        aria-label={t('HOME_USER_MENU')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={MENU_ID}
        isActive={isOpen}
        onClick={handleTriggerClick}
        className={styles.userAction}
        data-testid="user-profile-menu"
      >
        <UserAvatar />
        <span className={styles.greeting}>
          {t('HOME_GREETING', { name: user.display })}
        </span>
      </HeaderGlobalAction>
      <Menu
        id={MENU_ID}
        label={t('HOME_USER_MENU')}
        containerRef={triggerRef}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        menuAlignment="bottom-end"
        x={menuPosition.x}
        y={menuPosition.y}
      >
        <MenuItem
          label={t('HOME_CHANGE_PASSWORD')}
          onClick={() => {
            window.location.href = CHANGE_PASSWORD_PATH;
          }}
          data-testid="change-password-option"
        />
        <MenuItemDivider />
        <MenuItem
          label={t('HOME_LOGOUT')}
          onClick={handleLogout}
          disabled={isLoggingOut}
          data-testid="logout-option"
        />
      </Menu>
    </div>
  );
};
