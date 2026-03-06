import { Bundle, DocumentReference } from 'fhir/r4';
import { get, post, put } from '../../api';
import { DOCUMENT_REFERENCE_URL } from '../constants';
import {
  createDocumentReference,
  getDocumentReferencesByPatient,
  updateDocumentReference,
} from '../index';

jest.mock('../../api');

describe('Document Reference Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDocumentReferencesByPatient', () => {
    const patientUuid = 'patient-123';
    const mockDocumentReference: DocumentReference = {
      resourceType: 'DocumentReference',
      id: 'doc-1',
      status: 'current',
      content: [
        {
          attachment: {
            contentType: 'application/pdf',
            url: 'http://example.com/document.pdf',
          },
        },
      ],
    };

    const mockBundle: Bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [
        {
          resource: mockDocumentReference,
        },
      ],
    };

    it('should fetch document references with correct URL', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      await getDocumentReferencesByPatient(patientUuid);

      expect(get).toHaveBeenCalledWith(
        `${DOCUMENT_REFERENCE_URL}?patient=${patientUuid}`,
      );
    });

    it('should return array of document references', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getDocumentReferencesByPatient(patientUuid);

      expect(result).toEqual([mockDocumentReference]);
    });

    it('should return empty array when no entries', async () => {
      const emptyBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
      };
      (get as jest.Mock).mockResolvedValueOnce(emptyBundle);

      const result = await getDocumentReferencesByPatient(patientUuid);

      expect(result).toEqual([]);
    });

    it('should throw error when API call fails', async () => {
      const errorMessage = 'Network error';
      (get as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      await expect(getDocumentReferencesByPatient(patientUuid)).rejects.toThrow(
        errorMessage,
      );
    });
  });

  describe('createDocumentReference', () => {
    const mockDocumentReference: DocumentReference = {
      resourceType: 'DocumentReference',
      status: 'current',
      content: [
        {
          attachment: {
            contentType: 'application/pdf',
            url: 'http://example.com/document.pdf',
          },
        },
      ],
    };

    it('should create document reference with correct URL and body', async () => {
      (post as jest.Mock).mockResolvedValueOnce(mockDocumentReference);

      await createDocumentReference(mockDocumentReference);

      expect(post).toHaveBeenCalledWith(
        DOCUMENT_REFERENCE_URL,
        mockDocumentReference,
      );
    });

    it('should return document reference on successful creation', async () => {
      (post as jest.Mock).mockResolvedValueOnce(mockDocumentReference);

      const result = await createDocumentReference(mockDocumentReference);

      expect(result).toEqual(mockDocumentReference);
    });

    it('should throw error when API call fails', async () => {
      const errorMessage = 'Network error';
      (post as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        createDocumentReference(mockDocumentReference),
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('updateDocumentReference', () => {
    const mockDocumentReference: DocumentReference = {
      resourceType: 'DocumentReference',
      id: '123',
      status: 'current',
      content: [
        {
          attachment: {
            contentType: 'application/pdf',
            url: 'http://example.com/updated-document.pdf',
          },
        },
      ],
    };

    it('should update document reference with correct URL and body', async () => {
      (put as jest.Mock).mockResolvedValueOnce(mockDocumentReference);

      await updateDocumentReference(mockDocumentReference);

      expect(put).toHaveBeenCalledWith(
        DOCUMENT_REFERENCE_URL,
        mockDocumentReference,
      );
    });

    it('should return document reference on successful update', async () => {
      (put as jest.Mock).mockResolvedValueOnce(mockDocumentReference);

      const result = await updateDocumentReference(mockDocumentReference);

      expect(result).toEqual(mockDocumentReference);
    });

    it('should throw error when API call fails', async () => {
      const errorMessage = 'Network error';
      (put as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        updateDocumentReference(mockDocumentReference),
      ).rejects.toThrow(errorMessage);
    });
  });
});
