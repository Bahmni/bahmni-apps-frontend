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
} from 'react';
import { useActivePractitioner } from '../activePractitioner/useActivePractitioner';
import { useNotification } from '../notification/useNotification';
import { useUserPrivilege } from '../userPrivileges/useUserPrivilege';
import { registerDefaultActions } from './actions';
import { useUserActionRegistry } from './registry/hook';
import styles from './styles/UserGlobalAction.module.scss';

const MENU_ID = 'user-global-action-menu';

// `User.display` (the OpenMRS user resource) is the full name, e.g. "Jane Doe".
// The header greeting only has room for one word before truncating, so use
// just the first name rather than letting CSS ellipsis cut the full name.
const getFirstName = (display: string) => display.split(' ')[0];

// Resolves the index to focus next given the currently focused item's index.
// `current === -1` means focus was lost (no menu item is active) — fall back
// to the first item for ArrowDown and the last item for ArrowUp, rather than
// running the wrap-around formula on a nonexistent index.
const getNextFocusIndex = (current: number, delta: 1 | -1, length: number) => {
  if (current === -1) return delta === 1 ? 0 : length - 1;
  return (current + delta + length) % length;
};

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
  const { addNotification } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const registry = useUserActionRegistry();
  const { getActions, version } = registry;
  const hasRegistered = useRef(false);

  const { user, loading } = useActivePractitioner();

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

      const current = items.indexOf(document.activeElement as HTMLElement);
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      const next = getNextFocusIndex(current, delta, items.length);
      items[next].focus();
    };

    let frame = 0;
    let attempts = 0;
    let menuEl: HTMLElement | null = null;
    let cancelled = false;

    // The menu is portaled, so it may not exist on the first frame — retry until
    // its items render, then focus the first item and attach the key handler.
    const setup = () => {
      if (cancelled) return;

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
      // Guards against a stale retry callback from a previous open cycle
      // firing after this cleanup (e.g. rapid toggling of the menu).
      cancelled = true;
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
      <output
        id="user-global-action"
        data-testid="user-global-action-test-id"
        className={styles.container}
        aria-label={t('USER_GLOBAL_ACTION_LOADING')}
      >
        <SkeletonPlaceholder
          className={styles.skeleton}
          testId="user-global-action-skeleton-test-id"
        />
      </output>
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
          <span className={styles.greeting} title={user.display}>
            {t('USER_GLOBAL_ACTION_GREETING', {
              name: getFirstName(user.display),
            })}
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
            onClick={async () => {
              try {
                await action.onClick();
              } catch (error) {
                // Surface a toast so failures (e.g. logout) are visible to the
                // user, not just logged — parity with the old Home user menu.
                addNotification({
                  title: t('USER_GLOBAL_ACTION_ERROR_TITLE'),
                  message: t('USER_GLOBAL_ACTION_ERROR'),
                  type: 'error',
                });
                // eslint-disable-next-line no-console
                console.error(`User action "${action.id}" failed:`, error);
              }
            }}
            testId={`user-action-${action.id}`}
          />
        ))}
      </Menu>
    </div>
  );
};

UserGlobalAction.displayName = 'UserGlobalAction';
