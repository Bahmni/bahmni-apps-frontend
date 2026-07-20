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
  // handling, but in this header/portal + fixed-position setup it behaves
  // inconsistently (ArrowDown can fail to advance). Own it deterministically:
  // focus the first item on open (WAI-ARIA menu-button pattern) and move focus
  // with ArrowUp/ArrowDown ourselves, capturing the event so Carbon's handler
  // doesn't also run.
  useEffect(() => {
    if (!isOpen) return;

    const getItems = () =>
      Array.from(
        document
          .getElementById(MENU_ID)
          ?.querySelectorAll<HTMLElement>(
            '[role="menuitem"]:not([aria-disabled="true"])',
          ) ?? [],
      );

    let frame = 0;
    let attempts = 0;
    const focusFirstItem = () => {
      const items = getItems();
      if (items.length > 0) {
        items[0].focus();
      } else if (attempts < 5) {
        attempts += 1;
        frame = requestAnimationFrame(focusFirstItem);
      }
    };
    frame = requestAnimationFrame(focusFirstItem);

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const menu = document.getElementById(MENU_ID);
      if (!menu?.contains(document.activeElement)) return;

      const items = getItems();
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

    document.addEventListener('keydown', handleArrowKeys, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleArrowKeys, true);
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
