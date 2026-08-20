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

export async function saveDocuments(
  inputs: SaveDocumentInput[],
): Promise<unknown> {
  const [first] = inputs;
  if (!first) {
    return [];
  }

  const sharesTargetWithFirst = (input: SaveDocumentInput) =>
    input.patientUuid === first.patientUuid &&
    input.encounterUuid === first.encounterUuid &&
    input.createEncounterInVisit?.visitUuid ===
      first.createEncounterInVisit?.visitUuid;
  if (!inputs.every(sharesTargetWithFirst)) {
    throw new Error(
      'saveDocuments requires every document to share the same patient and save target',
    );
  }

  const { encounterUuid } = first;
  if (encounterUuid) {
    return Promise.all(
      inputs.map((input) =>
        createDocumentReference({ ...input, encounterUuid }),
      ),
    );
  }

  if (!first.createEncounterInVisit) {
    throw new Error(
      'saveDocument requires either encounterUuid or createEncounterInVisit',
    );
  }

  const { visitUuid, encounterTypeUuid, encounterTypeDisplay } =
    first.createEncounterInVisit;
  const encounterPlaceholder = `urn:uuid:${generateUUID()}`;
  const encounter = buildDocumentEncounter(
    first.patientUuid,
    visitUuid,
    encounterTypeUuid,
    getUserLoginLocation().uuid,
    encounterTypeDisplay,
    first.authorPractitionerUuid,
  );

  const bundle = createEncounterBundle([
    createBundleEntry(encounterPlaceholder, encounter, 'POST'),
    ...inputs.map((input) =>
      createBundleEntry(
        `urn:uuid:${generateUUID()}`,
        buildDocumentReference(input, encounterPlaceholder),
        'POST',
      ),
    ),
  ]);

  return post<unknown>(ENCOUNTER_BUNDLE_URL, bundle);
}

export async function saveDocument(input: SaveDocumentInput): Promise<unknown> {
  return saveDocuments([input]);
}
