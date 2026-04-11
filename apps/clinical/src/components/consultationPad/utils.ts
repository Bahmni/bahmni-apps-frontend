import { useServiceRequestStore } from '../../stores';
import { FORM_REGISTRY } from './formRegistry';
import type { FormRegistry } from './models';

export function getActiveEntries(encounterType: string): FormRegistry[] {
  return FORM_REGISTRY.filter(
    (entry) =>
      !entry.encounterTypes || entry.encounterTypes.includes(encounterType),
  );
}

export function captureUpdatedResources(entries: FormRegistry[]) {
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
