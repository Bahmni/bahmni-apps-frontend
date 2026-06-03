import {
  getMergedTranslations,
  getUserPreferredLocale,
  getConfig,
  getCurrentUserPrivileges,
  hasPrivilege,
} from '@bahmni/services';
import { useCallback, useEffect, useState } from 'react';
import {
  homeAppConfigSchema,
  type CommandPaletteExtension,
  type HomeAppConfig,
} from './commandPaletteConfigSchema';
import {
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
  DEFAULT_PATIENT_FIELDS,
  toExtensionArray,
  basePathFromTemplate,
  pathTemplateToGetPath,
  resolveLabel,
} from './utils';

interface CommandPaletteConfig {
  navItems: NavItem[];
  patientActions: PatientAction[];
  patientFieldsConfig: PatientFieldsConfig;
  trigger: TriggerConfig;
  searchAnnotations: SearchAnnotation[];
  t: (key: string, opts?: Record<string, string>) => string;
}

export function useCommandPaletteConfig(): CommandPaletteConfig {
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [patientActions, setPatientActions] = useState<PatientAction[]>([]);
  const [patientFieldsConfig, setPatientFieldsConfig] =
    useState<PatientFieldsConfig>(DEFAULT_PATIENT_FIELDS);
  const [trigger, setTrigger] = useState<TriggerConfig>(DEFAULT_TRIGGER);
  const [searchAnnotations, setSearchAnnotations] = useState<
    SearchAnnotation[]
  >([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [appConfigResult, privilegesResult] = await Promise.allSettled([
        getConfig<HomeAppConfig>(HOME_APP_CONFIG_URL, homeAppConfigSchema),
        getCurrentUserPrivileges(),
      ]);

      if (cancelled) return;

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

      if (cancelled) return;

      const allExtensions = extensionResults
        .filter(
          (r): r is PromiseFulfilledResult<CommandPaletteExtension[]> =>
            r.status === 'fulfilled',
        )
        .flatMap((r) => r.value);

      const lang = getUserPreferredLocale();
      const [langResults, enResults] = await Promise.all([
        Promise.allSettled(
          extensionApps.map((app) => getMergedTranslations(app, lang)),
        ),
        lang !== 'en'
          ? Promise.allSettled(
              extensionApps.map((app) => getMergedTranslations(app, 'en')),
            )
          : Promise.resolve(
              [] as PromiseSettledResult<Record<string, string>>[],
            ),
      ]);

      if (cancelled) return;

      const merged: Record<string, string> = {};
      enResults.forEach((r) => {
        if (r.status === 'fulfilled') Object.assign(merged, r.value);
      });
      langResults.forEach((r) => {
        if (r.status === 'fulfilled') Object.assign(merged, r.value);
      });
      setTranslations(merged);
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
          label: resolveLabel(e, merged),
          path: e.url ?? '',
          icon: e.icon,
          newTab: e.newTab,
        })),
      );

      setPatientActions(
        filterAndSort(COMMAND_PALETTE_PATIENT_ACTION_POINT).map((e) => ({
          id: e.id,
          label: resolveLabel(e, merged),
          icon: e.icon,
          getPath: pathTemplateToGetPath(e.pathTemplate ?? ''),
          basePath: basePathFromTemplate(e.pathTemplate ?? ''),
        })),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const t = useCallback(
    (key: string, opts?: Record<string, string>): string => {
      const value = translations[key] ?? key;
      if (!opts) return value;
      return Object.entries(opts).reduce(
        (str, [k, v]) => str.replace(`{{${k}}}`, v),
        value,
      );
    },
    [translations],
  );

  return {
    navItems,
    patientActions,
    patientFieldsConfig,
    trigger,
    searchAnnotations,
    t,
  };
}
