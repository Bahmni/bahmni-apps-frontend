import {
  FHIR_ENCOUNTER_TYPE_CODE_SYSTEM,
  FHIR_ENCOUNTER_CLASS_CODE_SYSTEM,
  FHIR_ENCOUNTER_TAG_SYSTEM,
} from '@bahmni/services';
import type { Encounter } from 'fhir/r4';

interface RegistrationEncounterParams {
  patientUuid: string;
  encounterTypeUuid: string;
  locationUuid: string;
  providerUuid?: string;
  visitUuid?: string;
  periodStart?: string;
}

export const buildRegistrationEncounterPayload = ({
  patientUuid,
  encounterTypeUuid,
  locationUuid,
  providerUuid,
  visitUuid,
  periodStart,
}: RegistrationEncounterParams): Encounter => ({
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
  type: [
    {
      coding: [
        {
          system: FHIR_ENCOUNTER_TYPE_CODE_SYSTEM,
          code: encounterTypeUuid,
        },
      ],
    },
  ],
  subject: { reference: `Patient/${patientUuid}` },
  location: [{ location: { reference: `Location/${locationUuid}` } }],
  ...(providerUuid && {
    participant: [
      {
        individual: {
          reference: `Practitioner/${providerUuid}`,
          type: 'Practitioner',
        },
      },
    ],
  }),
  ...(visitUuid && {
    partOf: { reference: `Encounter/${visitUuid}` },
  }),
  // Normalize to a FHIR-valid instant. OpenMRS returns datetimes with a
  // colon-less timezone offset (e.g. 2026-07-01T10:00:00.000+0000), which FHIR
  // rejects; new Date(...).toISOString() yields a valid `...Z` instant.
  period: {
    start: periodStart
      ? new Date(periodStart).toISOString()
      : new Date().toISOString(),
  },
});
