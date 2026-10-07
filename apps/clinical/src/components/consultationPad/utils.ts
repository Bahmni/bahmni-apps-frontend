import type { Encounter } from 'fhir/r4';
import { extractId } from '../../../../../packages/bahmni-widgets/src/utils/Observations';
import type {
  ConsultationEventAction,
  ConsultationEventContext,
} from '../../events/startConsultation';
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
): InputControl[];
/** @deprecated Use the (registry, context, action) overload instead. */
export function getActiveEntries(
  registry: InputControl[],
  encounterType: string | null | undefined,
  editOnlyKey: string | undefined,
): InputControl[];
export function getActiveEntries(
  registry: InputControl[],
  contextOrEncounterType:
    | ConsultationEventContext
    | string
    | null
    | undefined,
  actionOrEditOnlyKey:
    | ConsultationEventAction
    | string
    | undefined,
): InputControl[] {
  // Detect which overload is being used
  const isNewSignature =
    contextOrEncounterType === undefined ||
    contextOrEncounterType === null ||
    typeof contextOrEncounterType === 'object';

  if (isNewSignature) {
    const context = contextOrEncounterType as
      | ConsultationEventContext
      | undefined;
    const action = actionOrEditOnlyKey as ConsultationEventAction | undefined;
    return getActiveEntriesNew(registry, context, action);
  }

  // Legacy signature: (registry, encounterType, editOnlyKey)
  const encounterType = contextOrEncounterType as string;
  const editOnlyKey = actionOrEditOnlyKey as string | undefined;
  return getActiveEntriesLegacy(registry, encounterType, editOnlyKey);
}

function getActiveEntriesLegacy(
  registry: InputControl[],
  encounterType: string,
  editOnlyKey?: string,
): InputControl[] {
  return registry.filter((entry) => {
    const matchesEncounterType =
      !entry.encounterTypes || entry.encounterTypes.includes(encounterType);
    if (!matchesEncounterType) return false;

    if (entry.onActionTriggered && entry.key !== editOnlyKey) return false;

    // When editOnly is set, show only the target form + encounterDetails.
    if (editOnlyKey) {
      return (
        entry.key === editOnlyKey ||
        entry.key === ENCOUNTER_DETAILS_INPUT_CONTROL_KEY
      );
    }
    return true;
  });
}

function getActiveEntriesNew(
  registry: InputControl[],
  context: ConsultationEventContext | undefined,
  action: ConsultationEventAction | undefined,
): InputControl[] {
  // Derive encounterType from context
  const encounterType =
    context?.encounterType ??
    (context?.encounter?.type?.[0]?.coding?.[0]?.display as
      | string
      | undefined);

  // Step 1: Filter by encounterType
  const byEncounterType = registry.filter((entry) => {
    if (!entry.encounterTypes) return true;
    if (!encounterType) return true;
    return entry.encounterTypes.includes(encounterType);
  });

  // Step 2: No action — hide controls that are action-only (have handledActionTypes)
  if (!action) {
    return byEncounterType.filter(
      (entry) =>
        !entry.handledActionTypes?.length && !entry.onActionTriggered,
    );
  }

  // Step 3: action.type === 'delete' — show ONLY controls with handledActionTypes containing 'delete'
  if (action.type === 'delete') {
    const resourceType =
      action.resourceType ??
      (action.resources?.[0] as { resourceType?: string } | undefined)
        ?.resourceType;

    return byEncounterType.filter((entry) => {
      if (entry.key === ENCOUNTER_DETAILS_INPUT_CONTROL_KEY) return true;
      if (!entry.handledActionTypes?.includes('delete')) return false;
      // If resourceType is specified, also match handledResourceTypes
      if (resourceType && entry.handledResourceTypes) {
        return entry.handledResourceTypes.includes(resourceType);
      }
      return true;
    });
  }

  // Step 4: action.type === 'create' | 'update' — exclude action-only (delete) controls
  const resourceType =
    action.resourceType ??
    (action.resources?.[0] as { resourceType?: string } | undefined)
      ?.resourceType;

  return byEncounterType.filter((entry) => {
    // Exclude delete-only controls
    if (
      entry.handledActionTypes?.length &&
      !entry.handledActionTypes.includes(action.type)
    ) {
      return false;
    }
    // Exclude legacy onActionTriggered controls that are not action targets
    if (entry.onActionTriggered && !entry.handledActionTypes?.length) {
      return false;
    }
    // If resourceType is specified, filter to matching controls
    if (resourceType && entry.handledResourceTypes) {
      return entry.handledResourceTypes.includes(resourceType);
    }
    return true;
  });
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
