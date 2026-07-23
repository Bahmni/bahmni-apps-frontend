import { Condition, Bundle, Encounter } from 'fhir/r4';
import { get, put, post } from '../api';
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

/**
 * Fetches conditions for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a Bundle containing conditions
 */
export async function getConditionsBundle(
  patientUUID: string,
): Promise<Bundle> {
  return await get<Bundle>(`${PATIENT_CONDITION_RESOURCE_URL(patientUUID)}`);
}

/**
 * Fetches and extracts conditions for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of conditions
 */
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

/**
 * Fetches a single page of conditions using offset-based pagination.
 * Uses _getpagesoffset = (page - 1) * count to jump directly to any page.
 * @param patientUUID - The UUID of the patient
 * @param count - Number of items per page (default 10)
 * @param page - 1-based page number (default 1)
 * @param clinicalStatus - Optional FHIR clinical-status filter: 'active' or 'inactive'. When omitted, all conditions are returned.
 * @returns Promise resolving to a ConditionPage with conditions and total count
 */
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

/**
 * Builds a new FHIR Encounter for use when marking a condition inactive
 * in a mismatch scenario (non-MATCHED session). Reuses the active encounter's
 * type and visit reference. Participant is not set explicitly — OpenMRS populates
 * it from the authenticated session, the same way it sets changed_by on conditions.
 */
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

/**
 * Marks a condition as inactive via an EncounterBundle transaction (FHIR PUT inside bundle).
 *
 * Three code paths:
 *   1. matched=true && activeEncounter?.id present (AC1 — REUSE):
 *      Bundles a PUT Encounter + PUT Condition referencing the existing encounter.
 *   2. matched=false && activeEncounter present (AC2 — mismatch/SESSION_EXPIRED):
 *      Creates a new encounter reusing type/visit from activeEncounter; bundles with condition.
 *   3. activeEncounter is null but encounterTypeName + patientUuid provided (NO_ACTIVE_ENCOUNTER):
 *      Resolves the encounter type UUID by name, fetches the active visit, and bundles
 *      a new encounter + condition update. Same result as AC2, different context source.
 *
 * @param condition - The full raw FHIR Condition resource to update
 * @param activeEncounter - Full active encounter from the encounter session store
 * @param matched - True when activeEncounter is the clinician's own MATCHED (resumable) encounter
 * @param encounterTypeName - Encounter type name from widget config (e.g. "Consultation")
 * @param patientUuid - Patient UUID for fetching the active visit in the NO_ACTIVE_ENCOUNTER path
 * @returns Promise resolving to the server response
 */
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

  // AC1: MATCHED — reuse the existing encounter by reference
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

  // AC2 & fresh-visit: build a new encounter bundle
  // Source of type/visit differs but the bundle logic is identical.
  let newEncounterType: Encounter['type'];
  let newEncounterPartOf: Encounter['partOf'];
  let newEncounterSubject: Encounter['subject'];

  if (!matched && activeEncounter) {
    // AC2 — mismatch/SESSION_EXPIRED: copy context from the session encounter
    newEncounterType = activeEncounter.type;
    newEncounterPartOf = activeEncounter.partOf;
    newEncounterSubject = activeEncounter.subject;
  } else if (encounterTypeName && patientUuid) {
    // NO_ACTIVE_ENCOUNTER — resolve encounter type by name and fetch the active visit
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

  // Last resort: no encounter context — plain PUT without encounter reference
  return put<Condition, Condition>(
    `${CONDITION_RESOURCE_URL}/${condition.id}`,
    updatedCondition,
  );
}
