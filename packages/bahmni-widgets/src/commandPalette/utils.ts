import { formatUrl } from '@bahmni/services';
import type {
  CommandPaletteExtension,
  PatientActionContext,
  PatientFieldsConfig,
  TriggerConfig,
} from './CommandPaletteContext';

export const HOME_APP_CONFIG_URL = '/bahmni_config/openmrs/apps/home/app.json';
export const EXTENSION_BASE_URL = '/bahmni_config/openmrs/apps';
export const DEFAULT_EXTENSION_APPS = ['home'];

export const COMMAND_PALETTE_NAV_ITEM_POINT =
  'org.bahmni.commandpalette.navItem';
export const COMMAND_PALETTE_PATIENT_ACTION_POINT =
  'org.bahmni.commandpalette.patientAction';

export const DEFAULT_TRIGGER: TriggerConfig = {
  type: 'combination',
  keys: 'meta+k',
};
export const DEFAULT_DOUBLE_INTERVAL = 350;

export const DEFAULT_PATIENT_FIELDS: PatientFieldsConfig = {
  primaryFields: ['name', 'identifier'],
  additionalFields: ['age', 'gender'],
};


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

export function matchesKeys(e: KeyboardEvent, keys: string): boolean {
  const p = parseKeys(keys);
  return (
    e.key.toLowerCase() === p.key &&
    e.metaKey === p.meta &&
    e.ctrlKey === p.ctrl &&
    e.shiftKey === p.shift &&
    e.altKey === p.alt
  );
}

export function toExtensionArray(
  data: CommandPaletteExtension[] | Record<string, CommandPaletteExtension>,
): CommandPaletteExtension[] {
  return Array.isArray(data) ? data : Object.values(data);
}

export function basePathFromTemplate(template: string): string {
  return template.split('{{')[0].replace(/\/$/, '');
}

export function pathTemplateToGetPath(
  template: string,
): (context: PatientActionContext) => string {
  return ({ patientUuid, patientIdentifier = '' }) =>
    formatUrl(template, { patientUuid, patientIdentifier });
}

export function resolveLabel(
  e: CommandPaletteExtension,
  translations: Record<string, string>,
): string {
  if (e.translationKey) {
    return translations[e.translationKey] ?? e.label ?? e.translationKey;
  }
  return e.label ?? '';
}
