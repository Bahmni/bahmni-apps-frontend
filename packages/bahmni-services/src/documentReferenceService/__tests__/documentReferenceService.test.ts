import { Bundle, DocumentReference } from 'fhir/r4';
import { get } from '../../api';
import {
  getDocumentReferences,
  getFormattedDocumentReferences,
} from '../documentReferenceService';

jest.mock('../../api');

const mockedGet = get as jest.MockedFunction<typeof get>;

const PATIENT_UUID = 'test-patient-uuid';
const BASE_URL = `/openmrs/ws/fhir2/R4/DocumentReference?patient=${PATIENT_UUID}&_sort=-date&_count=100`;

const mockDocumentReference: DocumentReference = {
  resourceType: 'DocumentReference',
  id: 'doc-1',
  status: 'current',
  masterIdentifier: { value: 'Prescription_2024' },
  content: [
    {
      attachment: {
        contentType: 'application/pdf',
        url: '100/doc-uuid__prescription.pdf',
      },
    },
  ],
};

const mockBundle: Bundle<DocumentReference> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [{ resource: mockDocumentReference }],
};

describe('documentReferenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDocumentReferences', () => {
    it('fetches documents with correct URL for a given patient', async () => {
      mockedGet.mockResolvedValueOnce(mockBundle);

      await getDocumentReferences(PATIENT_UUID);

      expect(mockedGet).toHaveBeenCalledWith(BASE_URL);
    });

    it('returns the FHIR bundle from the API', async () => {
      mockedGet.mockResolvedValueOnce(mockBundle);

      const result = await getDocumentReferences(PATIENT_UUID);

      expect(result).toEqual(mockBundle);
    });

    it('appends encounter filter when encounterUuids are provided', async () => {
      mockedGet.mockResolvedValueOnce(mockBundle);
      const encounterUuids = ['enc-uuid-1', 'enc-uuid-2'];

      await getDocumentReferences(PATIENT_UUID, encounterUuids);

      expect(mockedGet).toHaveBeenCalledWith(
        `${BASE_URL}&encounter=enc-uuid-1,enc-uuid-2`,
      );
    });

    it('appends single encounter filter correctly', async () => {
      mockedGet.mockResolvedValueOnce(mockBundle);

      await getDocumentReferences(PATIENT_UUID, ['enc-uuid-1']);

      expect(mockedGet).toHaveBeenCalledWith(
        `${BASE_URL}&encounter=enc-uuid-1`,
      );
    });

    it('does not append encounter filter when encounterUuids is empty array', async () => {
      mockedGet.mockResolvedValueOnce(mockBundle);

      await getDocumentReferences(PATIENT_UUID, []);

      expect(mockedGet).toHaveBeenCalledWith(BASE_URL);
    });

    it('does not append encounter filter when encounterUuids is undefined', async () => {
      mockedGet.mockResolvedValueOnce(mockBundle);

      await getDocumentReferences(PATIENT_UUID, undefined);

      expect(mockedGet).toHaveBeenCalledWith(BASE_URL);
    });

    it('throws error when API call fails', async () => {
      const errorMessage = 'Network error';
      mockedGet.mockRejectedValueOnce(new Error(errorMessage));

      await expect(getDocumentReferences(PATIENT_UUID)).rejects.toThrow(
        errorMessage,
      );
    });

    it('returns bundle with empty entry when no documents exist', async () => {
      const emptyBundle: Bundle<DocumentReference> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      };
      mockedGet.mockResolvedValueOnce(emptyBundle);

      const result = await getDocumentReferences(PATIENT_UUID);

      expect(result.entry).toHaveLength(0);
    });
  });

  describe('getFormattedDocumentReferences', () => {
    it('transforms FHIR DocumentReference bundle entries to view models', async () => {
      mockedGet.mockResolvedValueOnce(mockBundle);

      const result = await getFormattedDocumentReferences(PATIENT_UUID);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'doc-1',
          documentIdentifier: 'Prescription_2024',
          contentType: 'application/pdf',
          documentUrl: '100/doc-uuid__prescription.pdf',
        }),
      );
    });

    it('handles missing masterIdentifier by using resource id', async () => {
      const docWithoutMasterIdentifier: DocumentReference = {
        resourceType: 'DocumentReference',
        id: 'doc-2',
        status: 'current',
        content: [
          {
            attachment: {
              contentType: 'application/pdf',
              url: '100/doc.pdf',
            },
          },
        ],
      };
      const bundleWithoutMasterIdentifier: Bundle<DocumentReference> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ resource: docWithoutMasterIdentifier }],
      };
      mockedGet.mockResolvedValueOnce(bundleWithoutMasterIdentifier);

      const result = await getFormattedDocumentReferences(PATIENT_UUID);

      expect(result[0].documentIdentifier).toBe('doc-2');
    });

    it('uses category coding display when type coding is absent', async () => {
      const docWithCategory: DocumentReference = {
        resourceType: 'DocumentReference',
        id: 'doc-cat',
        status: 'current',
        masterIdentifier: { value: 'CatDoc' },
        date: '2024-01-15T10:30:00Z',
        category: [
          {
            coding: [{ display: 'Radiology' }],
          },
        ],
        content: [
          {
            attachment: { contentType: 'image/jpeg', url: '/xray.jpg' },
          },
        ],
      };
      const bundleWithCategory: Bundle<DocumentReference> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ resource: docWithCategory }],
      };
      mockedGet.mockResolvedValueOnce(bundleWithCategory);

      const result = await getFormattedDocumentReferences(PATIENT_UUID);

      expect(result[0].documentType).toBe('Radiology');
    });

    it('handles missing optional fields gracefully', async () => {
      const docWithMissingFields: DocumentReference = {
        resourceType: 'DocumentReference',
        id: 'doc-3',
        status: 'current',
        masterIdentifier: { value: 'Document_3' },
        date: '2024-01-15T10:30:00Z',
        content: [
          {
            attachment: {
              contentType: 'application/pdf',
              url: '/path/to/document.pdf',
            },
          },
        ],
      };
      const bundleWithMissingFields: Bundle<DocumentReference> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ resource: docWithMissingFields }],
      };
      mockedGet.mockResolvedValueOnce(bundleWithMissingFields);

      const result = await getFormattedDocumentReferences(PATIENT_UUID);

      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'doc-3',
          documentIdentifier: 'Document_3',
          documentType: undefined,
          uploadedBy: undefined,
        }),
      );
    });

    it('filters out non-DocumentReference resources', async () => {
      const mixedBundle: Bundle<DocumentReference> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          { resource: mockDocumentReference },
          { resource: { resourceType: 'Observation', id: 'obs-1' } as any },
        ],
      };
      mockedGet.mockResolvedValueOnce(mixedBundle);

      const result = await getFormattedDocumentReferences(PATIENT_UUID);

      expect(result).toHaveLength(1);
      expect(result[0].documentIdentifier).toBe('Prescription_2024');
    });

    it('uses empty string for documentUrl when attachment url is absent', async () => {
      const docWithoutUrl: DocumentReference = {
        resourceType: 'DocumentReference',
        id: 'doc-no-url',
        status: 'current',
        masterIdentifier: { value: 'NoUrl' },
        date: '2024-01-15T10:30:00Z',
        content: [
          {
            attachment: { contentType: 'application/pdf' },
          },
        ],
      };
      const bundleWithoutUrl: Bundle<DocumentReference> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ resource: docWithoutUrl }],
      };
      mockedGet.mockResolvedValueOnce(bundleWithoutUrl);

      const result = await getFormattedDocumentReferences(PATIENT_UUID);

      expect(result[0].documentUrl).toBe('');
    });

    it('handles empty bundle entries', async () => {
      const emptyBundle: Bundle<DocumentReference> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      };
      mockedGet.mockResolvedValueOnce(emptyBundle);

      const result = await getFormattedDocumentReferences(PATIENT_UUID);

      expect(result).toEqual([]);
    });

    it('filters out entries without resources', async () => {
      const bundleWithNullResource: Bundle<DocumentReference> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          { resource: mockDocumentReference },
          { resource: undefined } as any,
        ],
      };
      mockedGet.mockResolvedValueOnce(bundleWithNullResource);

      const result = await getFormattedDocumentReferences(PATIENT_UUID);

      expect(result).toHaveLength(1);
    });

    it('appends encounter filter when encounterUuids are provided', async () => {
      mockedGet.mockResolvedValueOnce(mockBundle);
      const encounterUuids = ['enc-uuid-1', 'enc-uuid-2'];

      await getFormattedDocumentReferences(PATIENT_UUID, encounterUuids);

      expect(mockedGet).toHaveBeenCalledWith(
        `${BASE_URL}&encounter=enc-uuid-1,enc-uuid-2`,
      );
    });
  });
});
