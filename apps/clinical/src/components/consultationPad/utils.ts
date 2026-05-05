import type { ConsultationPad } from '../../providers/clinicalConfig/models';
import { useServiceRequestStore } from '../../stores';
import type { InputControl } from '../forms';
import { getRegisteredInputControls } from '../forms/registry';

export function loadEncounterInputControls(
  config: ConsultationPad | undefined,
): InputControl[] {
  return getRegisteredInputControls().flatMap((entry) => {
    const formConfig = config?.[entry.key] as
      | { encounterTypes?: string[]; privileges?: string[] }
      | undefined;
    if (!formConfig) return [];
    return [
      {
        ...entry,
        encounterTypes:
          entry.key === 'encounterDetails' || !formConfig.encounterTypes?.length
            ? undefined
            : formConfig.encounterTypes,
        privilege: formConfig.privileges?.length
          ? formConfig.privileges
          : undefined,
      },
    ];
  });
}

export function getActiveEntries(
  registry: InputControl[],
  encounterType: string,
): InputControl[] {
  return registry.filter(
    (entry) =>
      !entry.encounterTypes || entry.encounterTypes.includes(encounterType),
  );
}

export function captureUpdatedResources(entries: InputControl[]) {
  const serviceRequests: Record<string, boolean> = {};
  useServiceRequestStore
    .getState()
    .selectedServiceRequests.forEach((_, category) => {
      serviceRequests[category.toLowerCase()] = true;
    });

  const hasData = (key: string) =>
    entries.find((e) => e.key === key)?.hasData() ?? false;

  return {
    conditions: hasData('conditionsAndDiagnoses'),
    allergies: hasData('allergies'),
    medications: hasData('medications') || hasData('vaccinations'),
    immunizationHistory: hasData('immunizationHistory'),
    serviceRequests,
  };
}
