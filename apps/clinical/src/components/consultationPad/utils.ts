import {
  type ConsultationEventAction,
  type ConsultationEventContext,
} from '@bahmni/services';
import { CANCEL_VACCINATION_INPUT_CONTROL_KEY } from '@bahmni/widgets';
import type { Encounter } from 'fhir/r4';
import { extractId } from '../../../../../packages/bahmni-widgets/src/utils/Observations';
import type { ConsultationPad } from '../../providers/clinicalConfig/models';
import { useServiceRequestStore, useObservationFormsStore } from '../../stores';
import type { InputControl } from '../forms';
import { getRegisteredInputControls } from '../forms/registry';
import { ENCOUNTER_DETAILS_INPUT_CONTROL_KEY } from './constants';

type QueryStatus = 'pending' | 'error' | 'success';

export function getActiveEncounter(args: {
  sourceEncounterUuid: string | undefined;
  sourceEncounter: Encounter | null | undefined;
  sessionEncounter: Encounter | null | undefined;
  sessionEncounterStatus: QueryStatus;
}): Encounter | null | undefined {
  const {
    sourceEncounterUuid,
    sourceEncounter,
    sessionEncounter,
    sessionEncounterStatus,
  } = args;

  if (!sourceEncounterUuid) return sessionEncounter ?? null;
  if (sessionEncounterStatus === 'pending') return undefined;
  if (!sessionEncounter) return null;

  return sessionEncounter.id === sourceEncounterUuid
    ? sourceEncounter
    : sessionEncounter;
}

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
  context: ConsultationEventContext | undefined,
  action: ConsultationEventAction | undefined,
): InputControl[] {
  const encounterType = context?.encounterType;
  const byEncounterType = registry.filter(
    (entry) =>
      !entry.encounterTypes ||
      !encounterType ||
      entry.encounterTypes.includes(encounterType),
  );

  if (!action) {
    return byEncounterType.filter((entry) => !entry.handledActionTypes?.length);
  }

  const resourceType = getActionResourceType(action);
  const resourceStatus = getActionResourceStatus(action);

  const targets = byEncounterType.filter((entry) => {
    if (entry.key === ENCOUNTER_DETAILS_INPUT_CONTROL_KEY) return true;

    const handlesAction = entry.handledActionTypes?.length
      ? entry.handledActionTypes.includes(action.type)
      : action.type !== 'delete';
    if (!handlesAction) return false;

    if (resourceType && !entry.handledResourceTypes?.includes(resourceType)) {
      return false;
    }

    return (
      !resourceStatus ||
      !entry.handledResourceStatuses?.length ||
      entry.handledResourceStatuses.includes(resourceStatus)
    );
  });

  const hasExplicitStatusMatch =
    !!resourceStatus &&
    targets.some((entry) =>
      entry.handledResourceStatuses?.includes(resourceStatus),
    );

  return hasExplicitStatusMatch
    ? targets.filter(
        (entry) =>
          entry.key === ENCOUNTER_DETAILS_INPUT_CONTROL_KEY ||
          entry.handledResourceStatuses?.includes(resourceStatus),
      )
    : targets;
}

function getActionResourceType(
  action: ConsultationEventAction,
): string | undefined {
  return action.resourceType ?? action.resources?.[0]?.resourceType;
}

function getActionResourceStatus(
  action: ConsultationEventAction,
): string | undefined {
  return (action.resources?.[0] as { status?: string } | undefined)?.status;
}

const ACTION_TITLE_KEYS: Record<string, string> = {
  'update:AllergyIntolerance': 'EDIT_ALLERGIES_TITLE',
  'update:MedicationRequest': 'MEDICATIONS_EDIT_FORM_TITLE',
  'update:Observation': 'EDIT_OBSERVATION_FORM_TITLE',
  'delete:MedicationRequest': 'STOP_MEDICATION_FORM_TITLE',
};

export function getPadTitleKey(
  context: ConsultationEventContext | undefined,
  action: ConsultationEventAction | undefined,
  activeEntries: InputControl[],
): string {
  if (action) {
    if (
      action.type === 'delete' &&
      activeEntries.some((e) => e.key === CANCEL_VACCINATION_INPUT_CONTROL_KEY)
    ) {
      return 'CANCEL_VACCINATION_FORM_TITLE';
    }
    const titleKey =
      ACTION_TITLE_KEYS[`${action.type}:${getActionResourceType(action)}`];
    if (titleKey) return titleKey;
  } else if (context?.encounter) {
    return 'CONSULTATION_ACTION_CONTINUE';
  }
  return 'CONSULTATION_ACTION_NEW';
}

/**
 * Splits the active entries into those that submit directly (REST) and
 * those that go through the encounter bundle. An entry may do both:
 * controls that can only save part of their data through the bundle
 * (allergies) declare hasBundleData() to say whether the bundle flow is
 * still needed. hasBundleData() may be async (e.g. allergies awaits its
 * install-specific concept uuid before deciding), so this resolves before
 * createBundleEntries runs.
 */
export async function resolveSubmissionEntries(
  activeEntries: InputControl[],
): Promise<{
  directSubmitEntries: InputControl[];
  bundleEntries: InputControl[];
}> {
  const directSubmitEntries = activeEntries.filter(
    (entry) => entry.hasData() && entry.onDirectSubmit,
  );

  const bundleEntries: InputControl[] = [];
  for (const entry of activeEntries) {
    const includesInBundle =
      entry.hasData() &&
      (!entry.onDirectSubmit || (await entry.hasBundleData?.()));
    if (includesInBundle) bundleEntries.push(entry);
  }

  return { directSubmitEntries, bundleEntries };
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

  // Check if observation forms with basedOn references were saved
  const observationFormsData = useObservationFormsStore
    .getState()
    .getObservationFormsData();
  const observationFormsBasedOn = observationFormsData.find(
    (formData: { basedOn?: unknown }) => formData.basedOn !== undefined,
  );

  return {
    conditions: hasData('conditionsAndDiagnoses'),
    allergies: hasData('allergies'),
    medications:
      hasData('medication') ||
      hasData('vaccination') ||
      hasData('cancelVaccination') ||
      hasData('stopMedications'),
    immunizationHistory:
      hasData('immunizationHistory') ||
      hasData('immunizationAdministration') ||
      hasData('immunizationWaiver'),
    serviceRequests,
    observationFormsWithBasedOn: extractId(observationFormsBasedOn?.basedOn),
  };
}
