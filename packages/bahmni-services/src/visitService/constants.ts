import type { Encounter } from 'fhir/r4';
import { OPENMRS_REST_V1 } from '../constants/app';
import {
  FHIR_ENCOUNTER_CLASS_CODE_SYSTEM,
  FHIR_ENCOUNTER_TAG_SYSTEM,
} from '../constants/fhir';

export const FHIR_VISIT_TYPE_SYSTEM =
  'http://fhir.openmrs.org/code-system/visit-type'; // NOSONAR

export const VISIT_TYPES_URL = () =>
  OPENMRS_REST_V1 +
  `/bahmnicore/config/bahmniencounter?callerContext=REGISTRATION_CONCEPTS`;

export const CREATE_VISIT_URL =
  OPENMRS_REST_V1 + '/visit?v=custom:(uuid,startDatetime)';

export const GET_ACTIVE_VISIT_URL = (patientUuid: string) =>
  OPENMRS_REST_V1 +
  `/visit?patient=${patientUuid}&includeInactive=false&v=custom:(uuid,visitType,startDatetime,stopDatetime)`;

export const GET_VISIT_LOCATION = (loginLocation: string) =>
  OPENMRS_REST_V1 + `/bahmnicore/visitLocation/${loginLocation}`;

export const createFhirEncounterResource = (
  patientUuid: string,
  locationUuid: string,
  visitTypeUuid: string,
  episodeUuid?: string,
  endTime?: string,
): Encounter => ({
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
        code: 'visit',
        display: 'Visit',
      },
    ],
  },
  type: [
    {
      coding: [
        {
          system: FHIR_VISIT_TYPE_SYSTEM,
          code: visitTypeUuid,
        },
      ],
    },
  ],
  subject: { reference: `Patient/${patientUuid}`, type: 'Patient' },
  location: [
    {
      location: {
        reference: `Location/${locationUuid}`,
        type: 'Location',
      },
    },
  ],
  period: {
    start: new Date().toISOString(),
    ...(endTime && { end: endTime }),
  },
  ...(episodeUuid && {
    episodeOfCare: [{ reference: `EpisodeOfCare/${episodeUuid}` }],
  }),
});
