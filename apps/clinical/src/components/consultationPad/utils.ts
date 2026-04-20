import { useServiceRequestStore } from '../../stores';
import type { EncounterInputControl } from './models';

export function getActiveEntries(
  registry: EncounterInputControl[],
  encounterType: string,
): EncounterInputControl[] {
  return registry.filter(
    (entry) =>
      !entry.encounterTypes || entry.encounterTypes.includes(encounterType),
  );
}

export function captureUpdatedResources(entries: EncounterInputControl[]) {
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
    serviceRequests,
  };
}
