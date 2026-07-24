import { Condition, Bundle, Encounter } from 'fhir/r4';
import { get, post } from '../api';
import {
  FHIR_ENCOUNTER_CLASS_CODE_SYSTEM,
  FHIR_ENCOUNTER_TAG_SYSTEM,
  FHIR_ENCOUNTER_TYPE_CODE_SYSTEM,
  HL7_CONDITION_CATEGORY_CODE_SYSTEM,
  HL7_CONDITION_CATEGORY_CONDITION_CODE,
  HL7_CONDITION_CLINICAL_STATUS_CODE_SYSTEM,
} from '../constants/fhir';
import {
  createBundleEntry,
  createEncounterBundle,
  ENCOUNTER_BUNDLE_URL,
} from '../encounterBundle';
import {
  createFhirEncounter,
  getActiveVisit,
  getEncounterTypeByName,
} from '../encounterService';
import { getUserLoginLocation } from '../userService';
import {
  PATIENT_CONDITION_RESOURCE_URL,
  PATIENT_CONDITION_PAGE_URL,
} from './constants';

export async function getConditionsBundle(
  patientUUID: string,
): Promise<Bundle> {
  return await get<Bundle>(`${PATIENT_CONDITION_RESOURCE_URL(patientUUID)}`);
}

export async function getConditions(patientUUID: string): Promise<Condition[]> {
  const bundle = await getConditionsBundle(patientUUID);
  const conditions =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Condition')
      .map((entry) => entry.resource as Condition) ?? [];

  return conditions;
}

export interface ConditionPage {
  conditions: Condition[];
  total: number | undefined;
}

export async function getConditionPage(
  patientUUID: string,
  count: number = 10,
  page: number = 1,
  clinicalStatus?: 'active' | 'inactive',
): Promise<ConditionPage> {
  const offset = (page - 1) * count;
  const bundle = await get<Bundle>(
    PATIENT_CONDITION_PAGE_URL(patientUUID, count, offset, clinicalStatus),
  );
  const conditions =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Condition')
      .map((entry) => entry.resource as Condition) ?? [];
  return {
    conditions,
    total: bundle.total,
  };
}

function buildConditionEncounter(
  type: Encounter['type'],
  partOf: Encounter['partOf'],
  subject: Encounter['subject'],
  practitionerUUID?: string,
): Encounter {
  let locationUuid: string;
  try {
    locationUuid = getUserLoginLocation().uuid;
  } catch {
    throw new Error('Unable to build encounter: login location unavailable');
  }
  return {
    resourceType: 'Encounter',
    status: 'in-progress',
    class: {
      system: FHIR_ENCOUNTER_CLASS_CODE_SYSTEM,
      code: 'AMB',
      display: 'ambulatory',
    },
    meta: {
      tag: [
        {
          system: FHIR_ENCOUNTER_TAG_SYSTEM,
          code: 'encounter',
          display: 'Encounter',
        },
      ],
    },
    type,
    subject,
    partOf,
    participant: practitionerUUID
      ? [
          {
            individual: {
              reference: `Practitioner/${practitionerUUID}`,
              type: 'Practitioner',
            },
          },
        ]
      : undefined,
    location: [
      {
        location: {
          reference: `Location/${locationUuid}`,
          type: 'Location',
        },
      },
    ],
    period: { start: new Date().toISOString() },
  };
}

export async function markConditionAsInactive(
  condition: Condition,
  activeEncounter?: Encounter | null,
  matched: boolean = false,
  encounterTypeName?: string,
  patientUuid?: string,
  practitionerUUID?: string,
): Promise<Encounter> {
  // Category is intentionally always set to problem-list-item. Conditions managed via
  // this widget are problem-list conditions by definition, regardless of their original
  // stored category (e.g. encounter-diagnosis).
  const updatedCondition: Condition = {
    ...condition,
    category: [
      {
        coding: [
          {
            system: HL7_CONDITION_CATEGORY_CODE_SYSTEM,
            code: HL7_CONDITION_CATEGORY_CONDITION_CODE,
          },
        ],
      },
    ],
    clinicalStatus: {
      coding: [
        {
          system: HL7_CONDITION_CLINICAL_STATUS_CODE_SYSTEM,
          code: 'inactive',
          display: 'Inactive',
        },
      ],
      text: 'Inactive',
    },
  };

  if (matched && activeEncounter?.id) {
    // Rebuild the encounter resource fresh from its key fields (type, partOf, subject) and
    // graft the cached id onto it, rather than re-sending the cached snapshot verbatim.
    // This matches the codebase's established pattern (createEncounterBundleEntry) and
    // avoids a lost-update if the server-side encounter was modified after the session
    // snapshot was captured.
    const freshEncounter: Encounter = {
      ...buildConditionEncounter(
        activeEncounter.type,
        activeEncounter.partOf,
        activeEncounter.subject,
        practitionerUUID,
      ),
      id: activeEncounter.id,
    };
    const conditionWithEncounter: Condition = {
      ...updatedCondition,
      encounter: { reference: `Encounter/${activeEncounter.id}` },
    };
    const entries = [
      createBundleEntry(
        `Encounter/${activeEncounter.id}`,
        freshEncounter,
        'PUT',
        `Encounter/${activeEncounter.id}`,
      ),
      createBundleEntry(
        `Condition/${condition.id}`,
        conditionWithEncounter,
        'PUT',
        `Condition/${condition.id}`,
      ),
    ];
    await post<Bundle>(ENCOUNTER_BUNDLE_URL, createEncounterBundle(entries));
    return freshEncounter;
  }

  let newEncounterType: Encounter['type'];
  let newEncounterPartOf: Encounter['partOf'];
  let newEncounterSubject: Encounter['subject'];

  if (!matched && activeEncounter) {
    // Intentional: if there is a mismatched active encounter but its type or partOf is
    // missing, the encounterTypeName/patientUuid lookup path (else-if below) is not
    // retried — the bundle build simply fails at the newEncounterType guard below.
    newEncounterType = activeEncounter.type;
    newEncounterPartOf = activeEncounter.partOf;
    newEncounterSubject = activeEncounter.subject;
  } else if (encounterTypeName && patientUuid) {
    const [encounterType, activeVisit] = await Promise.all([
      getEncounterTypeByName(encounterTypeName),
      getActiveVisit(patientUuid),
    ]);
    if (encounterType?.uuid && activeVisit?.id) {
      newEncounterType = [
        {
          coding: [
            {
              system: FHIR_ENCOUNTER_TYPE_CODE_SYSTEM,
              code: encounterType.uuid,
              display: encounterType.name,
            },
          ],
        },
      ];
      newEncounterPartOf = {
        reference: `Encounter/${activeVisit.id}`,
        type: 'Encounter',
      };
      newEncounterSubject = condition.subject;
    }
  }

  if (newEncounterType && newEncounterPartOf) {
    const newEncounter = buildConditionEncounter(
      newEncounterType,
      newEncounterPartOf,
      newEncounterSubject,
      practitionerUUID,
    );
    // Create the encounter first so we have its server-assigned UUID before
    // building the bundle. OpenMRS does not reliably return entry.response.location
    // in transaction-response bundles, so a standalone POST is used to obtain the UUID.
    const createdEncounter = await createFhirEncounter(newEncounter);
    const conditionWithEncounter: Condition = {
      ...updatedCondition,
      encounter: { reference: `Encounter/${createdEncounter.id}` },
    };
    const entries = [
      createBundleEntry(
        `Encounter/${createdEncounter.id}`,
        createdEncounter,
        'PUT',
        `Encounter/${createdEncounter.id}`,
      ),
      createBundleEntry(
        `Condition/${condition.id}`,
        conditionWithEncounter,
        'PUT',
        `Condition/${condition.id}`,
      ),
    ];
    await post<Bundle>(ENCOUNTER_BUNDLE_URL, createEncounterBundle(entries));
    return createdEncounter;
  }

  throw new Error(
    'Unable to mark condition as inactive: no encounter context available',
  );
}
