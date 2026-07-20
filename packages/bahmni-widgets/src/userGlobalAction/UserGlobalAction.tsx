import { Menu, MenuItem, SkeletonPlaceholder } from '@bahmni/design-system';
import { hasPrivilege, useTranslation } from '@bahmni/services';
import { UserAvatar } from '@carbon/icons-react';
import { HeaderGlobalAction, HeaderGlobalActionProps } from '@carbon/react';
import {
  AriaAttributes,
  ComponentType,
  useState,
  useMemo,
  useEffect,
  useRef,
  useContext,
} from 'react';
import { ActivePractitionerContext } from '../activePractitioner/ActivePractitionerContext';
import { NotificationContext } from '../notification/NotificationContext';
import { useUserPrivilege } from '../userPrivileges/useUserPrivilege';
import { registerDefaultActions } from './actions';
import { useUserActionRegistry } from './registry/hook';
import styles from './styles/UserGlobalAction.module.scss';

const MENU_ID = 'user-global-action-menu';

// HeaderGlobalAction spreads unrecognised props (id, data-testid, aria-*) onto
// its underlying <button> at runtime, but its published type doesn't declare
// them. Widen the type locally instead of fighting Carbon's stale typings.
const HeaderGlobalActionWithHtmlAttrs = HeaderGlobalAction as ComponentType<
  HeaderGlobalActionProps & {
    id?: string;
    'data-testid'?: string;
    'aria-haspopup'?: AriaAttributes['aria-haspopup'];
    'aria-expanded'?: boolean;
    'aria-controls'?: string;
  }
>;

export const UserGlobalAction = () => {
  const { t } = useTranslation();
  const { userPrivileges } = useUserPrivilege();
  // Consumed directly (not via the throwing `useNotification` hook) so the widget
  // still works in an app that hasn't wired a `NotificationProvider` — it just
  // falls back to logging instead of a toast.
  const notification = useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);
  const registry = useUserActionRegistry();
  const { getActions, version } = registry;
  const hasRegistered = useRef(false);

  // Consumed directly (not via the throwing `useActivePractitioner` hook) so this
  // widget keeps working — avatar-only, no greeting — in apps that haven't wired
  // an `ActivePractitionerProvider` yet, instead of crashing the header.
  const activePractitioner = useContext(ActivePractitionerContext);
  const user = activePractitioner?.user ?? null;
  const loading = activePractitioner?.loading ?? false;

  useEffect(() => {
    if (!hasRegistered.current) {
      registerDefaultActions(registry);
      hasRegistered.current = true;
    }
  }, [registry]);

  // Keyboard navigation for the dropdown. Carbon's Menu ships its own arrow-key
  // handling, but in this header trigger + portaled, fixed-position setup its
  // focus-on-open runs before the items register and can leave focus on the
  // <ul>, after which ArrowDown fails to advance. Own it deterministically:
  // focus the first item on open (WAI-ARIA menu-button pattern) and move focus
  // with ArrowUp/ArrowDown ourselves. The listener is scoped to the menu element
  // (capture phase) — not the document — so it only acts on this menu's keys and
  // pre-empts Carbon's own handler.
  useEffect(() => {
    if (!isOpen) return;

    const getItems = (menu: HTMLElement) =>
      Array.from(
        menu.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([aria-disabled="true"])',
        ),
      );

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      if (!menuEl) return;

      const items = getItems(menuEl);
      if (items.length === 0) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      const current = items.findIndex(
        (item) => item === document.activeElement,
      );
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      const next = (current + delta + items.length) % items.length;
      items[next].focus();
    };

    let frame = 0;
    let attempts = 0;
    let menuEl: HTMLElement | null = null;

    // The menu is portaled, so it may not exist on the first frame — retry until
    // its items render, then focus the first item and attach the key handler.
    const setup = () => {
      const menu = document.getElementById(MENU_ID);
      const items = menu ? getItems(menu) : [];
      if (menu && items.length > 0) {
        menuEl = menu;
        items[0].focus();
        menu.addEventListener('keydown', handleArrowKeys, true);
      } else if (attempts < 5) {
        attempts += 1;
        frame = requestAnimationFrame(setup);
      }
    };
    frame = requestAnimationFrame(setup);

    return () => {
      cancelAnimationFrame(frame);
      menuEl?.removeEventListener('keydown', handleArrowKeys, true);
    };
  }, [isOpen]);

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

  if (loading) {
    return (
      <div
        id="user-global-action"
        data-testid="user-global-action-test-id"
        className={styles.container}
      >
        <SkeletonPlaceholder
          className={styles.skeleton}
          testId="user-global-action-skeleton-test-id"
        />
      </div>
    );
  }

  return (
    <div
      id="user-global-action"
      data-testid="user-global-action-test-id"
      className={styles.container}
    >
      <HeaderGlobalActionWithHtmlAttrs
        id="user-global-action-button"
        data-testid="user-global-action-button-test-id"
        aria-label={t('USER_GLOBAL_ACTION_BUTTON')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={MENU_ID}
        isActive={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={styles.userAction}
      >
        <UserAvatar id="user-icon" data-testid="user-icon-button-test-id" />
        {user?.display && (
          <span className={styles.greeting}>
            {t('USER_GLOBAL_ACTION_GREETING', { name: user.display })}
          </span>
        )}
      </HeaderGlobalActionWithHtmlAttrs>
      <Menu
        id={MENU_ID}
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
                // Surface a toast so failures (e.g. logout) are visible to the
                // user, not just logged — parity with the old Home user menu.
                notification?.addNotification({
                  title: t('USER_GLOBAL_ACTION_ERROR_TITLE'),
                  message: t('USER_GLOBAL_ACTION_ERROR'),
                  type: 'error',
                });
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
