import { DocumentReference } from 'fhir/r4';
import { post } from '../../api';
import { getUserLoginLocation } from '../../userService';
import { DOCUMENT_REFERENCE_URL, ENCOUNTER_BUNDLE_URL } from '../constants';
import { createDocumentReference, saveDocument } from '../documentWriteService';
import { SaveDocumentInput } from '../models';

jest.mock('../../api');
jest.mock('../../userService');

const mockedPost = post as jest.MockedFunction<typeof post>;
const mockedGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;

const PATIENT_UUID = 'patient-uuid';

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
    it('POSTs a single DocumentReference when encounterUuid is provided', async () => {
      await saveDocument({ ...baseInput, encounterUuid: 'enc-uuid' });

      expect(mockedPost).toHaveBeenCalledTimes(1);
      expect(mockedPost.mock.calls[0][0]).toBe(DOCUMENT_REFERENCE_URL);
    });

    it('includes the note as description and the author when provided', async () => {
      await saveDocument({
        ...baseInput,
        encounterUuid: 'enc-uuid',
        description: 'follow up',
        authorPractitionerUuid: 'prac-uuid',
      });

      const doc = mockedPost.mock.calls[0][1] as DocumentReference;
      expect(doc.description).toBe('follow up');
      expect(doc.author?.[0].reference).toBe('Practitioner/prac-uuid');
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
        encounterUuid: 'enc-uuid',
      });

      const doc = mockedPost.mock.calls[0][1] as DocumentReference;
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
});
