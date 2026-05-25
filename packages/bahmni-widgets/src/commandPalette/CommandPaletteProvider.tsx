import {
  formatUrl,
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
  type PatientActionContext,
  type PatientFieldsConfig,
  type TriggerConfig,
  type SearchAnnotation,
} from './CommandPaletteContext';

const HOME_APP_CONFIG_URL = '/bahmni_config/openmrs/apps/home/app.json';
const EXTENSION_BASE_URL = '/bahmni_config/openmrs/apps';
const DEFAULT_EXTENSION_APPS = ['home'];

const COMMAND_PALETTE_NAV_ITEM_POINT = 'org.bahmni.commandpalette.navItem';
const COMMAND_PALETTE_PATIENT_ACTION_POINT =
  'org.bahmni.commandpalette.patientAction';

const DEFAULT_TRIGGER: TriggerConfig = { type: 'combination', keys: 'meta+k' };
const DEFAULT_DOUBLE_INTERVAL = 350;

const DEFAULT_PATIENT_FIELDS: PatientFieldsConfig = {
  primaryFields: ['name', 'identifier'],
  additionalFields: ['age', 'gender'],
};

const LEGACY_APP_MAP: Record<string, string> = {
  bedmanagement: 'adt',
};

function detectCurrentApp(pathname: string): string {
  const newMatch = pathname.match(/^\/bahmni-new\/([^/]+)/);
  if (newMatch) return newMatch[1];
  const legacyMatch = pathname.match(/^\/bahmni\/([^/]+)/);
  if (legacyMatch) return LEGACY_APP_MAP[legacyMatch[1]] ?? legacyMatch[1];
  return 'home';
}

function parseKeys(keys: string): {
  key: string;
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
} {
  const parts = keys.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  const mods = new Set(parts.slice(0, -1));
  return {
    key,
    meta: mods.has('meta') || mods.has('cmd'),
    ctrl: mods.has('ctrl'),
    shift: mods.has('shift'),
    alt: mods.has('alt'),
  };
}

function matchesKeys(e: KeyboardEvent, keys: string): boolean {
  const p = parseKeys(keys);
  return (
    e.key.toLowerCase() === p.key &&
    e.metaKey === p.meta &&
    e.ctrlKey === p.ctrl &&
    e.shiftKey === p.shift &&
    e.altKey === p.alt
  );
}

function toExtensionArray(
  data: CommandPaletteExtension[] | Record<string, CommandPaletteExtension>,
): CommandPaletteExtension[] {
  return Array.isArray(data) ? data : Object.values(data);
}

function basePathFromTemplate(template: string): string {
  return template.split('{{')[0].replace(/\/$/, '');
}

function pathTemplateToGetPath(
  template: string,
): (context: PatientActionContext) => string {
  return ({ patientUuid, patientIdentifier = '' }) =>
    formatUrl(template, { patientUuid, patientIdentifier });
}

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
      const currentApp = detectCurrentApp(window.location.pathname);

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

      const filterAndSort = (extensionPointId: string) =>
        allExtensions
          .filter((e) => e.extensionPointId === extensionPointId)
          .filter((e) => !e.appContext || e.appContext === currentApp)
          .filter(
            (e) =>
              !e.requiredPrivilege ||
              hasPrivilege(userPrivileges, e.requiredPrivilege),
          )
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      setNavItems(
        filterAndSort(COMMAND_PALETTE_NAV_ITEM_POINT).map((e) => ({
          id: e.id,
          label: e.label,
          path: e.url ?? '',
          icon: e.icon,
          newTab: e.newTab,
        })),
      );

      setPatientActions(
        filterAndSort(COMMAND_PALETTE_PATIENT_ACTION_POINT).map((e) => ({
          id: e.id,
          label: e.label,
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
  if (parent) return <>{children}</>;
  return <CommandPaletteProviderInner>{children}</CommandPaletteProviderInner>;
};

CommandPaletteProvider.displayName = 'CommandPaletteProvider';
