import {
  BundleEntry,
  DocumentReference,
  Encounter,
  FhirResource,
} from 'fhir/r4';
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
import {
  AttachToExistingEncounter,
  CreateEncounterInVisit,
  DocumentPayload,
  SaveDocumentsInput,
} from './models';

// encounterReference is a concrete "Encounter/{uuid}" or a bundle-local "urn:uuid:..." placeholder.
function buildDocumentReference(
  patientUuid: string,
  input: DocumentPayload,
  encounterReference: string,
): DocumentReference {
  const documentReference: DocumentReference = {
    resourceType: 'DocumentReference',
    status: 'current',
    docStatus: 'final',
    subject: { reference: `Patient/${patientUuid}` },
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

export async function saveDocuments({
  patientUuid,
  target,
  documents,
}: SaveDocumentsInput): Promise<unknown> {
  if (documents.length === 0) {
    return [];
  }

  const entries =
    'encounterUuid' in target
      ? existingEncounterEntries(patientUuid, target, documents)
      : newEncounterEntries(
          patientUuid,
          target.createEncounterInVisit,
          documents,
        );

  return post<unknown>(ENCOUNTER_BUNDLE_URL, createEncounterBundle(entries));
}

function documentEntries(
  patientUuid: string,
  documents: DocumentPayload[],
  encounterReference: string,
): Array<BundleEntry<FhirResource>> {
  return documents.map((document) =>
    createBundleEntry(
      `urn:uuid:${generateUUID()}`,
      buildDocumentReference(patientUuid, document, encounterReference),
      'POST',
    ),
  );
}

function existingEncounterEntries(
  patientUuid: string,
  target: AttachToExistingEncounter,
  documents: DocumentPayload[],
): Array<BundleEntry<FhirResource>> {
  // fullUrl must equal the reference the documents carry, otherwise the server cannot resolve it:
  // the endpoint requires exactly one Encounter entry and matches encounter references against
  // bundle entry fullUrls.
  const encounterReference = `Encounter/${target.encounterUuid}`;
  return [
    createBundleEntry(
      encounterReference,
      { ...target.existingEncounter, id: target.encounterUuid },
      'PUT',
      encounterReference,
    ),
    ...documentEntries(patientUuid, documents, encounterReference),
  ];
}

function newEncounterEntries(
  patientUuid: string,
  createEncounterInVisit: CreateEncounterInVisit,
  documents: DocumentPayload[],
): Array<BundleEntry<FhirResource>> {
  const { visitUuid, encounterTypeUuid, encounterTypeDisplay } =
    createEncounterInVisit;
  const encounterPlaceholder = `urn:uuid:${generateUUID()}`;
  const encounter = buildDocumentEncounter(
    patientUuid,
    visitUuid,
    encounterTypeUuid,
    getUserLoginLocation().uuid,
    encounterTypeDisplay,
    documents[0]?.authorPractitionerUuid,
  );

  return [
    createBundleEntry(encounterPlaceholder, encounter, 'POST'),
    ...documentEntries(patientUuid, documents, encounterPlaceholder),
  ];
}
