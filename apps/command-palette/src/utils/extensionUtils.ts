import { formatUrl } from '@bahmni/services';
import type { PatientActionContext } from '@bahmni/widgets';
import type { CommandPaletteExtension } from '../models/commandPaletteConfig';

export const basePathFromTemplate = (template: string): string =>
  template.split('{{')[0].replace(/\/$/, '');

export const pathTemplateToGetPath =
  (template: string) =>
  ({ patientUuid, patientIdentifier = '' }: PatientActionContext): string =>
    formatUrl(template, { patientUuid, patientIdentifier });

export const resolveLabel = (e: CommandPaletteExtension): string =>
  e.label ?? e.translationKey ?? '';
