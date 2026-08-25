import { DocumentReference, Encounter } from 'fhir/r4';
import { post } from '../../api';
import { ENCOUNTER_BUNDLE_URL } from '../../encounterBundle';
import { getUserLoginLocation } from '../../userService';
import { DOCUMENT_REFERENCE_URL } from '../constants';
import {
  createDocumentReference,
  saveDocument,
  saveDocuments,
} from '../documentWriteService';
import { SaveDocumentInput } from '../models';

jest.mock('../../api');
jest.mock('../../userService');

const mockedPost = post as jest.MockedFunction<typeof post>;
const mockedGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;

const PATIENT_UUID = 'patient-uuid';

// Stands in for an encounter as the server returned it: the whole resource is re-sent on save.
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

interface TestBundle {
  resourceType: string;
  type: string;
  entry: Array<{
    fullUrl: string;
    resource: Record<string, unknown>;
    request: { method: string; url: string };
  }>;
}

const postedBundle = (callIndex = 0): TestBundle =>
  mockedPost.mock.calls[callIndex][1] as unknown as TestBundle;

const baseInput: SaveDocumentInput = {
  patientUuid: PATIENT_UUID,
  url: '100/doc-uuid__file.pdf',
  contentType: 'application/pdf',
  title: 'file.pdf',
  typeCode: 'type-uuid',
  typeDisplay: 'Prescription',
};

describe('documentWriteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPost.mockResolvedValue({});
    mockedGetUserLoginLocation.mockReturnValue({
      uuid: 'location-uuid',
    } as ReturnType<typeof getUserLoginLocation>);
  });

  describe('createDocumentReference', () => {
    it('POSTs a DocumentReference attached to the given encounter', async () => {
      await createDocumentReference({
        ...baseInput,
        encounterUuid: 'enc-uuid',
      });

      expect(mockedPost).toHaveBeenCalledTimes(1);
      const [url, body] = mockedPost.mock.calls[0];
      const doc = body as DocumentReference;
      expect(url).toBe(DOCUMENT_REFERENCE_URL);
      expect(doc.resourceType).toBe('DocumentReference');
      expect(doc.subject?.reference).toBe(`Patient/${PATIENT_UUID}`);
      expect(doc.context?.encounter?.[0].reference).toBe('Encounter/enc-uuid');
      expect(doc.content?.[0].attachment.url).toBe(baseInput.url);
      expect(doc.type?.coding?.[0].code).toBe('type-uuid');
    });
  });

  describe('saveDocument', () => {
    it('attaches to an existing encounter via a single EncounterBundle transaction', async () => {
      await saveDocument({ ...baseInput, ...existingEncounterTarget });

      expect(mockedPost).toHaveBeenCalledTimes(1);
      const [url] = mockedPost.mock.calls[0];
      const bundle = postedBundle();
      expect(url).toBe(ENCOUNTER_BUNDLE_URL);
      expect(bundle.resourceType).toBe('EncounterBundle');
      expect(bundle.type).toBe('transaction');
      expect(bundle.entry).toHaveLength(2);

      const [encounterEntry, docEntry] = bundle.entry;
      expect(encounterEntry.fullUrl).toBe('Encounter/enc-uuid');
      expect(encounterEntry.request).toEqual({
        method: 'PUT',
        url: 'Encounter/enc-uuid',
      });
      expect(docEntry.request.method).toBe('POST');
      expect(docEntry.request.url).toBe('DocumentReference');
      expect(
        (docEntry.resource as unknown as DocumentReference).context
          ?.encounter?.[0].reference,
      ).toBe('Encounter/enc-uuid');
    });

    it('re-sends the existing encounter unchanged so the update cannot drop its fields', async () => {
      await saveDocument({ ...baseInput, ...existingEncounterTarget });

      const [encounterEntry] = postedBundle().entry;
      expect(encounterEntry.resource).toEqual(EXISTING_ENCOUNTER);
    });

    it('normalises the encounter id to the bare uuid the PUT url expects', async () => {
      await saveDocument({
        ...baseInput,
        encounterUuid: 'enc-uuid',
        existingEncounter: { ...EXISTING_ENCOUNTER, id: 'Encounter/enc-uuid' },
      });

      expect(postedBundle().entry[0].resource.id).toBe('enc-uuid');
    });

    it('includes the note as description and the author when provided', async () => {
      await saveDocument({
        ...baseInput,
        ...existingEncounterTarget,
        description: 'follow up',
        authorPractitionerUuid: 'prac-uuid',
      });

      const doc = postedBundle().entry[1]
        .resource as unknown as DocumentReference;
      expect(doc.description).toBe('follow up');
      expect(doc.author?.[0].reference).toBe('Practitioner/prac-uuid');
    });

    it('throws when an existing encounter uuid arrives without its resource', async () => {
      await expect(
        saveDocument({ ...baseInput, encounterUuid: 'enc-uuid' }),
      ).rejects.toThrow('requires existingEncounter alongside encounterUuid');
      expect(mockedPost).not.toHaveBeenCalled();
    });

    it('creates the encounter and document atomically via an EncounterBundle', async () => {
      await saveDocument({
        ...baseInput,
        authorPractitionerUuid: 'prac-uuid',
        createEncounterInVisit: {
          visitUuid: 'visit-uuid',
          encounterTypeUuid: 'enc-type-uuid',
          encounterTypeDisplay: 'Patient Document',
        },
      });

      expect(mockedPost).toHaveBeenCalledTimes(1);
      const [url, body] = mockedPost.mock.calls[0];
      const bundle = body as {
        resourceType: string;
        type: string;
        entry: Array<{ fullUrl: string; resource: Record<string, unknown> }>;
      };
      expect(url).toBe(ENCOUNTER_BUNDLE_URL);
      expect(bundle.resourceType).toBe('EncounterBundle');
      expect(bundle.type).toBe('transaction');
      expect(bundle.entry).toHaveLength(2);

      const [encounterEntry, docEntry] = bundle.entry;
      const encounter = encounterEntry.resource as unknown as {
        resourceType: string;
        partOf: { reference: string };
        location: Array<{ location: { reference: string } }>;
        participant: Array<{ individual: { reference: string } }>;
      };
      const doc = docEntry.resource as unknown as DocumentReference;
      expect(encounter.resourceType).toBe('Encounter');
      expect(encounter.partOf.reference).toBe('Encounter/visit-uuid');
      expect(encounter.location[0].location.reference).toBe(
        'Location/location-uuid',
      );
      expect(encounter.participant[0].individual.reference).toBe(
        'Practitioner/prac-uuid',
      );
      // The document must reference the bundle-local encounter placeholder so the
      // transaction wires the new encounter to the new document.
      expect(doc.context?.encounter?.[0].reference).toBe(
        encounterEntry.fullUrl,
      );
    });

    it('omits type, description and author when they are not provided', async () => {
      await saveDocument({
        patientUuid: PATIENT_UUID,
        url: '100/doc-uuid__file.pdf',
        contentType: 'application/pdf',
        title: 'file.pdf',
        ...existingEncounterTarget,
      });

      const doc = postedBundle().entry[1]
        .resource as unknown as DocumentReference;
      expect(doc.type).toBeUndefined();
      expect(doc.description).toBeUndefined();
      expect(doc.author).toBeUndefined();
    });

    it('creates the document encounter without a participant when no author is given', async () => {
      await saveDocument({
        patientUuid: PATIENT_UUID,
        url: '100/doc-uuid__file.pdf',
        contentType: 'application/pdf',
        title: 'file.pdf',
        createEncounterInVisit: {
          visitUuid: 'visit-uuid',
          encounterTypeUuid: 'enc-type-uuid',
        },
      });

      const bundle = mockedPost.mock.calls[0][1] as {
        entry: Array<{ resource: { participant?: unknown } }>;
      };
      expect(bundle.entry[0].resource.participant).toBeUndefined();
    });

    it('throws when neither encounterUuid nor createEncounterInVisit is provided', async () => {
      await expect(saveDocument(baseInput)).rejects.toThrow(
        'saveDocument requires either encounterUuid or createEncounterInVisit',
      );
      expect(mockedPost).not.toHaveBeenCalled();
    });
  });

  describe('saveDocuments', () => {
    const secondInput: SaveDocumentInput = {
      ...baseInput,
      url: '100/doc-uuid__scan.png',
      contentType: 'image/png',
      title: 'scan.png',
    };

    it('saves a batch against an existing encounter in one transaction', async () => {
      await saveDocuments([
        { ...baseInput, ...existingEncounterTarget },
        { ...secondInput, ...existingEncounterTarget },
      ]);

      expect(mockedPost).toHaveBeenCalledTimes(1);
      const [url] = mockedPost.mock.calls[0];
      const bundle = postedBundle();
      expect(url).toBe(ENCOUNTER_BUNDLE_URL);
      expect(bundle.entry).toHaveLength(3);

      const [encounterEntry, ...documentEntries] = bundle.entry;
      expect(encounterEntry.request.method).toBe('PUT');
      expect(
        documentEntries.map(
          (entry) =>
            (entry.resource as unknown as DocumentReference).context
              ?.encounter?.[0].reference,
        ),
      ).toEqual(['Encounter/enc-uuid', 'Encounter/enc-uuid']);
      expect(
        documentEntries.map(
          (entry) =>
            (entry.resource as unknown as DocumentReference).content?.[0]
              .attachment.title,
        ),
      ).toEqual(['file.pdf', 'scan.png']);
      // Each document needs its own placeholder so the transaction creates two resources.
      expect(new Set(documentEntries.map((entry) => entry.fullUrl)).size).toBe(
        2,
      );
    });

    it('creates a single encounter for the whole batch when the visit has none yet', async () => {
      const createEncounterInVisit = {
        visitUuid: 'visit-uuid',
        encounterTypeUuid: 'enc-type-uuid',
        encounterTypeDisplay: 'Patient Document',
      };

      await saveDocuments([
        { ...baseInput, createEncounterInVisit },
        { ...secondInput, createEncounterInVisit },
      ]);

      expect(mockedPost).toHaveBeenCalledTimes(1);
      const [url, body] = mockedPost.mock.calls[0];
      const bundle = body as {
        entry: Array<{ fullUrl: string; resource: Record<string, unknown> }>;
      };
      expect(url).toBe(ENCOUNTER_BUNDLE_URL);
      expect(bundle.entry).toHaveLength(3);

      const [encounterEntry, ...documentEntries] = bundle.entry;
      expect(encounterEntry.resource.resourceType).toBe('Encounter');
      expect(
        documentEntries.map(
          (entry) =>
            (entry.resource as unknown as DocumentReference).context
              ?.encounter?.[0].reference,
        ),
      ).toEqual([encounterEntry.fullUrl, encounterEntry.fullUrl]);
      expect(
        documentEntries.map(
          (entry) =>
            (entry.resource as unknown as DocumentReference).content?.[0]
              .attachment.title,
        ),
      ).toEqual(['file.pdf', 'scan.png']);
    });

    it('posts nothing for an empty batch', async () => {
      await expect(saveDocuments([])).resolves.toEqual([]);
      expect(mockedPost).not.toHaveBeenCalled();
    });

    it('refuses a batch whose documents do not share one patient and target', async () => {
      await expect(
        saveDocuments([
          { ...baseInput, ...existingEncounterTarget },
          { ...secondInput, encounterUuid: 'another-enc-uuid' },
        ]),
      ).rejects.toThrow('same patient and save target');

      await expect(
        saveDocuments([
          { ...baseInput, ...existingEncounterTarget },
          {
            ...secondInput,
            ...existingEncounterTarget,
            patientUuid: 'other-patient',
          },
        ]),
      ).rejects.toThrow('same patient and save target');

      expect(mockedPost).not.toHaveBeenCalled();
    });
  });
});
