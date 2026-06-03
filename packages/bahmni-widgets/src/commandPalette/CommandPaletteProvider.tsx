import {
  getMergedTranslations,
  getUserPreferredLocale,
  getConfig,
  getCurrentUserPrivileges,
  hasPrivilege,
} from '@bahmni/services';
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { CommandPalette } from './CommandPalette';
import { homeAppConfigSchema } from './commandPaletteConfigSchema';
import {
  CommandPaletteContext,
  type CommandPaletteExtension,
  type HomeAppConfig,
  type NavItem,
  type PatientAction,
  type PatientFieldsConfig,
  type TriggerConfig,
  type SearchAnnotation,
} from './CommandPaletteContext';
import {
  HOME_APP_CONFIG_URL,
  EXTENSION_BASE_URL,
  DEFAULT_EXTENSION_APPS,
  COMMAND_PALETTE_NAV_ITEM_POINT,
  COMMAND_PALETTE_PATIENT_ACTION_POINT,
  DEFAULT_TRIGGER,
  DEFAULT_DOUBLE_INTERVAL,
  DEFAULT_PATIENT_FIELDS,
  matchesKeys,
  toExtensionArray,
  basePathFromTemplate,
  pathTemplateToGetPath,
  resolveLabel,
} from './utils';

interface CommandPaletteProviderProps {
  children?: ReactNode;
}

const CommandPaletteProviderInner: React.FC<CommandPaletteProviderProps> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [patientActions, setPatientActions] = useState<PatientAction[]>([]);
  const [patientFieldsConfig, setPatientFieldsConfig] =
    useState<PatientFieldsConfig>(DEFAULT_PATIENT_FIELDS);
  const [trigger, setTrigger] = useState<TriggerConfig>(DEFAULT_TRIGGER);
  const [searchAnnotations, setSearchAnnotations] = useState<
    SearchAnnotation[]
  >([]);
  const lastPressTimeRef = useRef<number>(0);

  useEffect(() => {
    (async () => {
      const [appConfigResult, privilegesResult] = await Promise.allSettled([
        getConfig<HomeAppConfig>(HOME_APP_CONFIG_URL, homeAppConfigSchema),
        getCurrentUserPrivileges(),
      ]);

      const appConfig =
        appConfigResult.status === 'fulfilled' ? appConfigResult.value : null;
      const userPrivileges =
        privilegesResult.status === 'fulfilled' ? privilegesResult.value : null;

      if (appConfig) {
        const cp = appConfig.commandPalette;
        if (cp?.trigger) setTrigger(cp.trigger);
        if (cp?.patientFields) setPatientFieldsConfig(cp.patientFields);
        if (cp?.searchAnnotations) setSearchAnnotations(cp.searchAnnotations);
      }

      const extensionApps =
        appConfig?.commandPalette?.extensionApps ?? DEFAULT_EXTENSION_APPS;
      const currentPath = window.location.pathname;

      const extensionResults = await Promise.allSettled(
        extensionApps.map((app) =>
          fetch(`${EXTENSION_BASE_URL}/${app}/v2/extension.json`)
            .then((r) => {
              if (!r.ok)
                throw new Error(
                  `Failed to load extensions for ${app}: ${r.status}`,
                );
              return r.json() as Promise<
                | CommandPaletteExtension[]
                | Record<string, CommandPaletteExtension>
              >;
            })
            .then(toExtensionArray),
        ),
      );

      const allExtensions = extensionResults
        .filter(
          (r): r is PromiseFulfilledResult<CommandPaletteExtension[]> =>
            r.status === 'fulfilled',
        )
        .flatMap((r) => r.value);

      const lang = getUserPreferredLocale();
      const translationResults = await Promise.allSettled(
        extensionApps.map((app) => getMergedTranslations(app, lang)),
      );
      const translations: Record<string, string> = {};
      translationResults.forEach((r) => {
        if (r.status === 'fulfilled') Object.assign(translations, r.value);
      });

      const filterAndSort = (extensionPointId: string) =>
        allExtensions
          .filter((e) => e.extensionPointId === extensionPointId)
          .filter((e) => {
            if (!e.appContext) return true;
            const paths = Array.isArray(e.appContext)
              ? e.appContext
              : [e.appContext];
            return paths.some((p) => currentPath.startsWith(p));
          })
          .filter(
            (e) =>
              !e.requiredPrivilege ||
              hasPrivilege(userPrivileges, e.requiredPrivilege),
          )
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      setNavItems(
        filterAndSort(COMMAND_PALETTE_NAV_ITEM_POINT).map((e) => ({
          id: e.id,
          label: resolveLabel(e, translations),
          path: e.url ?? '',
          icon: e.icon,
          newTab: e.newTab,
        })),
      );

      setPatientActions(
        filterAndSort(COMMAND_PALETTE_PATIENT_ACTION_POINT).map((e) => ({
          id: e.id,
          label: resolveLabel(e, translations),
          icon: e.icon,
          getPath: pathTemplateToGetPath(e.pathTemplate ?? ''),
          basePath: basePathFromTemplate(e.pathTemplate ?? ''),
        })),
      );
    })();
  }, []);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const setOpen = useCallback((open: boolean) => setIsOpen(open), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        return;
      }

      if (trigger.type === 'combination') {
        if (matchesKeys(e, trigger.keys)) {
          e.preventDefault();
          toggle();
        }
      } else if (trigger.type === 'double') {
        const active = document.activeElement;
        const isTyping =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active instanceof HTMLSelectElement ||
          (active as HTMLElement)?.isContentEditable;

        if (matchesKeys(e, trigger.key) && !isTyping) {
          const now = Date.now();
          const interval = trigger.interval ?? DEFAULT_DOUBLE_INTERVAL;
          if (now - lastPressTimeRef.current <= interval) {
            e.preventDefault();
            toggle();
            lastPressTimeRef.current = 0;
          } else {
            lastPressTimeRef.current = now;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, trigger]);

  return (
    <CommandPaletteContext.Provider
      value={{
        isOpen,
        toggle,
        setOpen,
        navItems,
        patientActions,
        patientFieldsConfig,
        searchAnnotations,
      }}
    >
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
};

export const CommandPaletteProvider: React.FC<CommandPaletteProviderProps> = ({
  children,
}) => {
  const parent = useContext(CommandPaletteContext);
  if (parent) return children as React.ReactElement;
  return <CommandPaletteProviderInner>{children}</CommandPaletteProviderInner>;
};

CommandPaletteProvider.displayName = 'CommandPaletteProvider';
