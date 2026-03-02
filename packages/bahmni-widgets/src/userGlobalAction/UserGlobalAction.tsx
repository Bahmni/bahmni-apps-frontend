import {
  Icon,
  MenuItem,
  ICON_SIZE,
  Menu,
  IconButton,
} from '@bahmni/design-system';
import { hasPrivilege, useTranslation } from '@bahmni/services';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useUserPrivilege } from '../userPrivileges/useUserPrivilege';
import { registerDefaultActions } from './actions';
import { useUserActionRegistry } from './registry/hook';
import styles from './styles/UserGlobalAction.module.scss';

export const UserGlobalAction = () => {
  const { t } = useTranslation();
  const { userPrivileges } = useUserPrivilege();
  const [isOpen, setIsOpen] = useState(false);
  const registry = useUserActionRegistry();
  const { getActions, version } = registry;
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (!hasRegistered.current) {
      registerDefaultActions(registry);
      hasRegistered.current = true;
    }
  }, []);

  const filteredActions = useMemo(() => {
    return getActions()
      .filter(
        (action) =>
          !action.requiredPrivilege ||
          action.requiredPrivilege.every((privilege) =>
            hasPrivilege(userPrivileges, privilege),
          ),
      )
      .filter((action) => !action.disabled);
  }, [userPrivileges, version]);

  return (
    <div
      id="user-global-action"
      data-testid="user-global-action-test-id"
      aria-label="user-global-action-aria-label"
      className={styles.container}
    >
      <IconButton
        id="user-global-action-button"
        data-testid="user-global-action-button-test-id"
        aria-label="user-global-action-button-aria-label"
        kind="ghost"
        size="lg"
        onClick={() => setIsOpen(true)}
        label={t('USER_GLOBAL_ACTION_BUTTON')}
      >
        <Icon
          id="user-icon"
          data-testid="user-icon-button-test-id"
          aria-label="user-icon-button-aria-label"
          name="fa-user"
          size={ICON_SIZE.LG}
        />
      </IconButton>
      <Menu
        id="user-global-action-menu"
        data-testid="user-global-action-menu-test-id"
        aria-label="user-global-action-menu-aria-label"
        open={isOpen}
        className={styles.menu}
        label={t('USER_GLOBAL_ACTION_MENU')}
        onClose={() => setIsOpen(false)}
      >
        {filteredActions.map((action) => (
          <MenuItem
            id={`user-global-action-${action.id}`}
            data-testid={`user-global-action-${action.id}-test-id`}
            aria-label={`user-global-action-${action.id}-aria-label`}
            key={action.id}
            label={t(action.label)}
            onClick={action.onClick}
            testId={`user-action-${action.id}`}
          />
        ))}
      </Menu>
    </div>
  );
};

UserGlobalAction.displayName = 'UserGlobalAction';
