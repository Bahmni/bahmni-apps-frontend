import { useServiceRequestStore } from '../../stores';
import { INPUT_CONTROL_REGISTRY } from './inputControlRegistry';
import type { InputControlRegistry } from './models';

export function getActiveEntries(
  encounterType: string,
): InputControlRegistry[] {
  return INPUT_CONTROL_REGISTRY.filter(
    (entry) =>
      !entry.encounterTypes || entry.encounterTypes.includes(encounterType),
  );
}

export function captureUpdatedResources(entries: InputControlRegistry[]) {
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
