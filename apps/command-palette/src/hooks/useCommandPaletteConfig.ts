import {
  getConfig,
  getCurrentUserPrivileges,
  fetchModuleExtensions,
  hasPrivilege,
  initAppI18n,
} from '@bahmni/services';
import type {
  NavItem,
  PatientAction,
  PatientFieldsConfig,
  SearchAnnotation,
  TriggerConfig,
} from '@bahmni/widgets';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BAHMNI_COMMAND_PALETTE_NAMESPACE,
  COMMAND_PALETTE_APP_CONFIG_URL,
  DEFAULT_TRIGGER,
  DEFAULT_PATIENT_FIELDS,
} from '../constants/app';
import {
  COMMAND_PALETTE_NAV_ITEM_POINT,
  COMMAND_PALETTE_PATIENT_ACTION_POINT,
} from '../constants/extensionPoints';
import type {
  CommandPaletteConfig,
  CommandPaletteExtension,
  CommandPaletteAppJson,
} from '../models/commandPaletteConfig';
import {
  basePathFromTemplate,
  pathTemplateToGetPath,
  resolveLabel,
} from '../utils/extensionUtils';
import commandPaletteAppJsonSchema from './schema.json';

export type { CommandPaletteConfig };

export function useCommandPaletteConfig(): CommandPaletteConfig {
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [patientActions, setPatientActions] = useState<PatientAction[]>([]);
  const [patientFieldsConfig, setPatientFieldsConfig] =
    useState<PatientFieldsConfig>(DEFAULT_PATIENT_FIELDS);
  const [trigger, setTrigger] = useState<TriggerConfig>(DEFAULT_TRIGGER);
  const [searchAnnotations, setSearchAnnotations] = useState<
    SearchAnnotation[]
  >([]);
  const [allExtensions, setAllExtensions] = useState<CommandPaletteExtension[]>(
    [],
  );
  const [userPrivileges, setUserPrivileges] = useState<string[] | null>(null);

  const { pathname } = useLocation();

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      const [, appConfigResult, privilegesResult, extensionsResult] =
        await Promise.allSettled([
          initAppI18n(BAHMNI_COMMAND_PALETTE_NAMESPACE),
          getConfig<CommandPaletteAppJson>(
            COMMAND_PALETTE_APP_CONFIG_URL,
            commandPaletteAppJsonSchema,
          ),
          getCurrentUserPrivileges(),
          fetchModuleExtensions('command-palette'),
        ]);

      if (controller.signal.aborted) return;

      const appConfig =
        appConfigResult.status === 'fulfilled' ? appConfigResult.value : null;

      if (appConfig) {
        const cp = appConfig.commandPalette;
        if (cp?.trigger) setTrigger(cp.trigger);
        if (cp?.patientFields) setPatientFieldsConfig(cp.patientFields);
        if (cp?.searchAnnotations) setSearchAnnotations(cp.searchAnnotations);
      }

      setUserPrivileges(
        privilegesResult.status === 'fulfilled' ? privilegesResult.value : null,
      );
      setAllExtensions(
        extensionsResult.status === 'fulfilled'
          ? (extensionsResult.value as unknown as CommandPaletteExtension[])
          : [],
      );
    })();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const filterAndSort = (extensionPointId: string) =>
      allExtensions
        .filter((e) => e.extensionPointId === extensionPointId)
        .filter((e) => {
          if (!e.appContext) return true;
          const paths = Array.isArray(e.appContext)
            ? e.appContext
            : [e.appContext];
          return paths.some((p) => pathname.startsWith(p));
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
        label: resolveLabel(e),
        path: e.url ?? '',
        icon: e.icon,
        newTab: e.newTab,
      })),
    );

    setPatientActions(
      filterAndSort(COMMAND_PALETTE_PATIENT_ACTION_POINT).map((e) => ({
        id: e.id,
        label: resolveLabel(e),
        icon: e.icon,
        getPath: pathTemplateToGetPath(e.pathTemplate ?? ''),
        basePath: basePathFromTemplate(e.pathTemplate ?? ''),
      })),
    );
  }, [allExtensions, userPrivileges, pathname]);

  return {
    navItems,
    patientActions,
    patientFieldsConfig,
    trigger,
    searchAnnotations,
  };
}
