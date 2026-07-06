import { DocumentReference, Encounter } from 'fhir/r4';
import { post } from '../api';
import {
  FHIR_ENCOUNTER_CLASS_CODE_SYSTEM,
  FHIR_ENCOUNTER_TAG_SYSTEM,
  FHIR_ENCOUNTER_TYPE_CODE_SYSTEM,
} from '../constants/fhir';
import {
  createBundleEntry,
  createEncounterBundle,
  ENCOUNTER_BUNDLE_URL,
} from '../encounterBundle';
import { getUserLoginLocation } from '../userService';
import { generateUUID } from '../utils/utils';
import { DOCUMENT_REFERENCE_URL } from './constants';
import { CreateDocumentReferenceInput, SaveDocumentInput } from './models';

// encounterReference is a concrete "Encounter/{uuid}" or a bundle-local "urn:uuid:..." placeholder.
function buildDocumentReference(
  input: SaveDocumentInput,
  encounterReference: string,
): DocumentReference {
  const documentReference: DocumentReference = {
    resourceType: 'DocumentReference',
    status: 'current',
    docStatus: 'final',
    subject: { reference: `Patient/${input.patientUuid}` },
    content: [
      {
        attachment: {
          contentType: input.contentType,
          url: input.url,
          title: input.title,
        },
      },
    ],
    context: { encounter: [{ reference: encounterReference }] },
  };
  if (input.typeCode) {
    documentReference.type = {
      coding: [{ code: input.typeCode, display: input.typeDisplay }],
    };
  }
  if (input.description) {
    documentReference.description = input.description;
  }
  if (input.authorPractitionerUuid) {
    documentReference.author = [
      {
        reference: `Practitioner/${input.authorPractitionerUuid}`,
        type: 'Practitioner',
      },
    ];
  }
  return documentReference;
}

function buildDocumentEncounter(
  patientUuid: string,
  visitUuid: string,
  encounterTypeUuid: string,
  locationUuid: string,
  encounterTypeDisplay?: string,
  authorPractitionerUuid?: string,
): Encounter {
  const encounter: Encounter = {
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
    type: [
      {
        coding: [
          {
            system: FHIR_ENCOUNTER_TYPE_CODE_SYSTEM,
            code: encounterTypeUuid,
            display: encounterTypeDisplay,
          },
        ],
      },
    ],
    subject: { reference: `Patient/${patientUuid}` },
    partOf: { reference: `Encounter/${visitUuid}`, type: 'Encounter' },
    location: [
      { location: { reference: `Location/${locationUuid}`, type: 'Location' } },
    ],
    period: { start: new Date().toISOString() },
  };
  if (authorPractitionerUuid) {
    encounter.participant = [
      {
        individual: {
          reference: `Practitioner/${authorPractitionerUuid}`,
          type: 'Practitioner',
        },
      },
    ];
  }
  return encounter;
}

export async function createDocumentReference(
  input: CreateDocumentReferenceInput,
): Promise<DocumentReference> {
  const documentReference = buildDocumentReference(
    input,
    `Encounter/${input.encounterUuid}`,
  );
  return post<DocumentReference>(DOCUMENT_REFERENCE_URL, documentReference);
}

// With encounterUuid, POST a single DocumentReference. Otherwise create the document encounter and
// the DocumentReference together in one atomic EncounterBundle transaction.
export async function saveDocument(input: SaveDocumentInput): Promise<unknown> {
  if (input.encounterUuid) {
    return createDocumentReference({
      ...input,
      encounterUuid: input.encounterUuid,
    });
  }

  if (!input.createEncounterInVisit) {
    throw new Error(
      'saveDocument requires either encounterUuid or createEncounterInVisit',
    );
  }

  const { visitUuid, encounterTypeUuid, encounterTypeDisplay } =
    input.createEncounterInVisit;
  const encounterPlaceholder = `urn:uuid:${generateUUID()}`;
  const encounter = buildDocumentEncounter(
    input.patientUuid,
    visitUuid,
    encounterTypeUuid,
    getUserLoginLocation().uuid,
    encounterTypeDisplay,
    input.authorPractitionerUuid,
  );
  const documentReference = buildDocumentReference(input, encounterPlaceholder);

  const bundle = createEncounterBundle([
    createBundleEntry(encounterPlaceholder, encounter, 'POST'),
    createBundleEntry(`urn:uuid:${generateUUID()}`, documentReference, 'POST'),
  ]);

  return post<unknown>(ENCOUNTER_BUNDLE_URL, bundle);
}
