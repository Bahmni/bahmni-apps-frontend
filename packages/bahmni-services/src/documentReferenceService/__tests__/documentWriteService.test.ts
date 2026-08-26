import { DocumentReference, Encounter } from 'fhir/r4';
import { post } from '../../api';
import { ENCOUNTER_BUNDLE_URL } from '../../encounterBundle';
import { getUserLoginLocation } from '../../userService';
import { saveDocuments } from '../documentWriteService';
import { DocumentPayload } from '../models';

jest.mock('../../api');
jest.mock('../../userService');

const mockedPost = post as jest.MockedFunction<typeof post>;
const mockedGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;

const PATIENT_UUID = 'patient-uuid';

const EXISTING_ENCOUNTER: Encounter = {
  resourceType: 'Encounter',
  id: 'enc-uuid',
  status: 'finished',
  class: { code: 'AMB', display: 'ambulatory' },
  type: [{ coding: [{ code: 'enc-type-uuid', display: 'Patient Document' }] }],
  subject: { reference: `Patient/${PATIENT_UUID}` },
  partOf: { reference: 'Encounter/visit-uuid', type: 'Encounter' },
  location: [{ location: { reference: 'Location/location-uuid' } }],
  participant: [{ individual: { reference: 'Practitioner/prac-uuid' } }],
  period: { start: '2026-06-29T09:00:00Z' },
};

const existingEncounterTarget = {
  encounterUuid: 'enc-uuid',
  existingEncounter: EXISTING_ENCOUNTER,
};

const createEncounterInVisit = {
  visitUuid: 'visit-uuid',
  encounterTypeUuid: 'enc-type-uuid',
  encounterTypeDisplay: 'Patient Document',
};

const firstDocument: DocumentPayload = {
  url: '100/doc-uuid__file.pdf',
  contentType: 'application/pdf',
  title: 'file.pdf',
  typeCode: 'type-uuid',
  typeDisplay: 'Prescription',
};

const secondDocument: DocumentPayload = {
  url: '100/doc-uuid__scan.png',
  contentType: 'image/png',
  title: 'scan.png',
};

interface TestBundle {
  resourceType: string;
  type: string;
  entry: Array<{
    fullUrl: string;
    resource: Record<string, unknown>;
    request: { method: string; url: string };
  }>;
}

const postedBundle = (): TestBundle =>
  mockedPost.mock.calls[0][1] as unknown as TestBundle;

const docAt = (index: number) =>
  postedBundle().entry[index].resource as unknown as DocumentReference;

describe('documentWriteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPost.mockResolvedValue({});
    mockedGetUserLoginLocation.mockReturnValue({
      uuid: 'location-uuid',
    } as ReturnType<typeof getUserLoginLocation>);
  });

  describe('attaching to an existing encounter', () => {
    it('sends one bundle re-stating the encounter and linking each document to it', async () => {
      await saveDocuments({
        patientUuid: PATIENT_UUID,
        target: existingEncounterTarget,
        documents: [firstDocument],
      });

      expect(mockedPost).toHaveBeenCalledTimes(1);
      const [url] = mockedPost.mock.calls[0];
      const bundle = postedBundle();
      expect(url).toBe(ENCOUNTER_BUNDLE_URL);
      expect(bundle.resourceType).toBe('EncounterBundle');
      expect(bundle.type).toBe('transaction');
      expect(bundle.entry).toHaveLength(2);

      // The endpoint requires exactly one Encounter entry, and resolves a document's encounter
      // reference by matching it against a bundle entry's fullUrl — hence the concrete reference
      // on both, and the PUT.
      const [encounterEntry, docEntry] = bundle.entry;
      expect(encounterEntry.fullUrl).toBe('Encounter/enc-uuid');
      expect(encounterEntry.request).toEqual({
        method: 'PUT',
        url: 'Encounter/enc-uuid',
      });
      expect(docEntry.request).toEqual({
        method: 'POST',
        url: 'DocumentReference',
      });
      expect(docAt(1).subject?.reference).toBe(`Patient/${PATIENT_UUID}`);
      expect(docAt(1).context?.encounter?.[0].reference).toBe(
        'Encounter/enc-uuid',
      );
      expect(docAt(1).content?.[0].attachment.url).toBe(firstDocument.url);
      expect(docAt(1).type?.coding?.[0].code).toBe('type-uuid');
    });

    it('re-sends the encounter unchanged apart from a bare-uuid id', async () => {
      await saveDocuments({
        patientUuid: PATIENT_UUID,
        target: {
          encounterUuid: 'enc-uuid',
          existingEncounter: {
            ...EXISTING_ENCOUNTER,
            id: 'Encounter/enc-uuid',
          },
        },
        documents: [firstDocument],
      });

      // Sent whole because the OpenMRS encounter update writes subject, type, partOf, location,
      // participant and period from the payload without null-guards.
      expect(postedBundle().entry[0].resource).toEqual(EXISTING_ENCOUNTER);
    });

    it('sends a batch as one transaction with a distinct placeholder per document', async () => {
      await saveDocuments({
        patientUuid: PATIENT_UUID,
        target: existingEncounterTarget,
        documents: [firstDocument, secondDocument],
      });

      expect(mockedPost).toHaveBeenCalledTimes(1);
      const bundle = postedBundle();
      expect(bundle.entry).toHaveLength(3);
      const documentEntries = bundle.entry.slice(1);
      expect(
        documentEntries.map(
          (entry) =>
            (entry.resource as unknown as DocumentReference).content?.[0]
              .attachment.title,
        ),
      ).toEqual(['file.pdf', 'scan.png']);
      expect(new Set(documentEntries.map((e) => e.fullUrl)).size).toBe(2);
    });

    it('carries the note as description and the author when provided', async () => {
      await saveDocuments({
        patientUuid: PATIENT_UUID,
        target: existingEncounterTarget,
        documents: [
          {
            ...firstDocument,
            description: 'follow up',
            authorPractitionerUuid: 'prac-uuid',
          },
        ],
      });

      expect(docAt(1).description).toBe('follow up');
      expect(docAt(1).author?.[0].reference).toBe('Practitioner/prac-uuid');
    });

    it('omits type, description and author when they are not provided', async () => {
      await saveDocuments({
        patientUuid: PATIENT_UUID,
        target: existingEncounterTarget,
        documents: [{ url: '100/doc.pdf', contentType: 'application/pdf' }],
      });

      expect(docAt(1).type).toBeUndefined();
      expect(docAt(1).description).toBeUndefined();
      expect(docAt(1).author).toBeUndefined();
    });
  });

  describe('creating an encounter in the visit', () => {
    it('creates one encounter for the batch and links every document to it', async () => {
      await saveDocuments({
        patientUuid: PATIENT_UUID,
        target: { createEncounterInVisit },
        documents: [
          { ...firstDocument, authorPractitionerUuid: 'prac-uuid' },
          secondDocument,
        ],
      });

      expect(mockedPost).toHaveBeenCalledTimes(1);
      const [url] = mockedPost.mock.calls[0];
      const bundle = postedBundle();
      expect(url).toBe(ENCOUNTER_BUNDLE_URL);
      expect(bundle.entry).toHaveLength(3);

      const [encounterEntry, ...documentEntries] = bundle.entry;
      const encounter = encounterEntry.resource as unknown as {
        resourceType: string;
        partOf: { reference: string };
        location: Array<{ location: { reference: string } }>;
        participant: Array<{ individual: { reference: string } }>;
      };
      expect(encounter.resourceType).toBe('Encounter');
      expect(encounterEntry.request.method).toBe('POST');
      expect(encounter.partOf.reference).toBe('Encounter/visit-uuid');
      expect(encounter.location[0].location.reference).toBe(
        'Location/location-uuid',
      );
      expect(encounter.participant[0].individual.reference).toBe(
        'Practitioner/prac-uuid',
      );

      // Documents point at the bundle-local placeholder so the transaction wires them to the
      // encounter it is creating.
      expect(
        documentEntries.map(
          (entry) =>
            (entry.resource as unknown as DocumentReference).context
              ?.encounter?.[0].reference,
        ),
      ).toEqual([encounterEntry.fullUrl, encounterEntry.fullUrl]);
    });

    it('creates the encounter without a participant when no author is given', async () => {
      await saveDocuments({
        patientUuid: PATIENT_UUID,
        target: { createEncounterInVisit },
        documents: [firstDocument],
      });

      expect(postedBundle().entry[0].resource.participant).toBeUndefined();
    });
  });

  it('posts nothing for an empty batch', async () => {
    await expect(
      saveDocuments({
        patientUuid: PATIENT_UUID,
        target: existingEncounterTarget,
        documents: [],
      }),
    ).resolves.toEqual([]);
    expect(mockedPost).not.toHaveBeenCalled();
  });
});
