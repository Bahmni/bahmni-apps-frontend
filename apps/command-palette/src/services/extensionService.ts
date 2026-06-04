import { formatUrl } from '@bahmni/services';
import type { PatientActionContext } from '@bahmni/widgets';
import { EXTENSION_BASE_URL } from '../constants/app';
import type { CommandPaletteExtension } from '../types/commandPaletteConfig';

export function toExtensionArray(
  data: CommandPaletteExtension[] | Record<string, CommandPaletteExtension>,
): CommandPaletteExtension[] {
  return Array.isArray(data) ? data : Object.values(data);
}

export async function fetchExtensions(
  app: string,
  signal?: AbortSignal,
): Promise<CommandPaletteExtension[]> {
  const r = await fetch(`${EXTENSION_BASE_URL}/${app}/v2/extension.json`, {
    signal,
  });
  if (!r.ok)
    throw new Error(`Failed to load extensions for ${app}: ${r.status}`);
  return toExtensionArray(
    (await r.json()) as
      | CommandPaletteExtension[]
      | Record<string, CommandPaletteExtension>,
  );
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

export function resolveLabel(e: CommandPaletteExtension): string {
  return e.label ?? e.translationKey ?? '';
}
