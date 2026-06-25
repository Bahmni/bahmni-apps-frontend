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
  }, [registry]);

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
    // `getActions` reads the registry ref; `version` is the change signal that drives recompute
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPrivileges, version]);

  return (
    <div
      id="user-global-action"
      data-testid="user-global-action-test-id"
      className={styles.container}
    >
      <IconButton
        id="user-global-action-button"
        data-testid="user-global-action-button-test-id"
        kind="ghost"
        size="lg"
        onClick={() => setIsOpen(true)}
        label={t('USER_GLOBAL_ACTION_BUTTON')}
        align="bottom-end"
      >
        <Icon
          id="user-icon"
          data-testid="user-icon-button-test-id"
          name="fa-user"
          size={ICON_SIZE.LG}
        />
      </IconButton>
      <Menu
        id="user-global-action-menu"
        data-testid="user-global-action-menu-test-id"
        open={isOpen}
        className={styles.menu}
        label={t('USER_GLOBAL_ACTION_MENU')}
        onClose={() => setIsOpen(false)}
      >
        {filteredActions.map((action) => (
          <MenuItem
            id={`user-global-action-${action.id}`}
            data-testid={`user-global-action-${action.id}-test-id`}
            key={action.id}
            label={t(action.label)}
            onClick={() => {
              Promise.resolve(action.onClick()).catch((error) => {
                // eslint-disable-next-line no-console
                console.error(`User action "${action.id}" failed:`, error);
              });
            }}
            testId={`user-action-${action.id}`}
          />
        ))}
      </Menu>
    </div>
  );
};

UserGlobalAction.displayName = 'UserGlobalAction';
