import type { ConsultationPad } from '../../providers/clinicalConfig/models';
import { useServiceRequestStore } from '../../stores';
import type { InputControl } from '../forms';
import { getRegisteredInputControls } from '../forms/registry';
import { ENCOUNTER_DETAILS_INPUT_CONTROL_KEY } from './constants';

export function loadEncounterInputControls(
  config: ConsultationPad | undefined,
): InputControl[] {
  if (!config) return [];
  const registeredControls = getRegisteredInputControls();
  return [...config.inputControls]
    .sort((a, b) => {
      if (a.type === ENCOUNTER_DETAILS_INPUT_CONTROL_KEY) return -1;
      if (b.type === ENCOUNTER_DETAILS_INPUT_CONTROL_KEY) return 1;
      return 0;
    })
    .flatMap((inputControlConfig) => {
      const entry = registeredControls.find(
        (e) => e.key === inputControlConfig.type,
      );
      if (!entry) return [];
      return [
        {
          ...entry,
          inputControlConfig,
          encounterTypes:
            inputControlConfig.type === ENCOUNTER_DETAILS_INPUT_CONTROL_KEY ||
            !inputControlConfig.encounterTypes?.length
              ? undefined
              : inputControlConfig.encounterTypes,
          privilege: inputControlConfig.privileges?.length
            ? inputControlConfig.privileges
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
    immunizationHistory:
      hasData('immunizationHistory') || hasData('immunizationAdministration'),
    serviceRequests,
  };
}
