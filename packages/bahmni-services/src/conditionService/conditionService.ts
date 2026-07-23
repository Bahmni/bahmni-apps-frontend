import { Condition, Bundle, Encounter } from 'fhir/r4';
import { get, post } from '../api';
import {
  FHIR_ENCOUNTER_CLASS_CODE_SYSTEM,
  FHIR_ENCOUNTER_TAG_SYSTEM,
  HL7_CONDITION_CATEGORY_CODE_SYSTEM,
  HL7_CONDITION_CATEGORY_CONDITION_CODE,
  HL7_CONDITION_CLINICAL_STATUS_CODE_SYSTEM,
  FHIR_ENCOUNTER_TYPE_CODE_SYSTEM,
} from '../constants/fhir';
import {
  createBundleEntry,
  createEncounterBundle,
  ENCOUNTER_BUNDLE_URL,
} from '../encounterBundle';
import { getActiveVisit, getEncounterTypeByName } from '../encounterService';
import { getUserLoginLocation } from '../userService';
import { generateUUID } from '../utils/utils';
import {
  CONDITION_RESOURCE_URL,
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

// Participant omitted — OpenMRS derives it from the authenticated session user.
function buildConditionEncounter(
  type: Encounter['type'],
  partOf: Encounter['partOf'],
  subject: Encounter['subject'],
): Encounter {
  const locationUuid = getUserLoginLocation().uuid;
  return {
    resourceType: 'Encounter',
    status: 'finished',
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
): Promise<unknown> {
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
    const conditionWithEncounter: Condition = {
      ...updatedCondition,
      encounter: { reference: `Encounter/${activeEncounter.id}` },
    };
    const entries = [
      createBundleEntry(
        `Encounter/${activeEncounter.id}`,
        activeEncounter,
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
    return post<unknown>(ENCOUNTER_BUNDLE_URL, createEncounterBundle(entries));
  }

  let newEncounterType: Encounter['type'];
  let newEncounterPartOf: Encounter['partOf'];
  let newEncounterSubject: Encounter['subject'];

  if (!matched && activeEncounter) {
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
    const placeholder = `urn:uuid:${generateUUID()}`;
    const newEncounter = buildConditionEncounter(
      newEncounterType,
      newEncounterPartOf,
      newEncounterSubject,
    );
    const conditionWithEncounter: Condition = {
      ...updatedCondition,
      encounter: { reference: placeholder },
    };
    const entries = [
      createBundleEntry(placeholder, newEncounter, 'POST'),
      createBundleEntry(
        `Condition/${condition.id}`,
        conditionWithEncounter,
        'PUT',
        `Condition/${condition.id}`,
      ),
    ];
    return post<unknown>(ENCOUNTER_BUNDLE_URL, createEncounterBundle(entries));
  }

  throw new Error(
    'Unable to mark condition as inactive: no encounter context available',
  );
}
