import { post } from '../../api';
import { UPLOAD_DOCUMENT_URL } from '../constants';
import { uploadDocument } from '../documentUploadService';
import { processFileForUpload } from '../utils';

jest.mock('../../api');
jest.mock('../utils');

describe('documentUploadService', () => {
  describe('uploadDocument', () => {
    const mockFile = new File(
      ['test'],
      'Screenshot 2025-03-22 at 7.10.26 PM.png',
      {
        type: 'image/png',
      },
    );
    const encounterTypeName = 'Patient Document';
    const patientUuid = 'c355883a-8386-470e-9ae9-776fb9ec8557';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should upload document successfully', async () => {
      const mockProcessedFile = {
        content: 'iVBORw0KGgoAAAANSUhEUgAAAAUA',
        fileName: 'Screenshot 2025-03-22 at 7.10.26 PM',
        fileType: 'image',
        format: 'png',
      };

      const mockResponse = {
        url: '100/10-Patient Document-10afc37f-05f9-424b-8600-19ca24ce9236__Screenshot-2025-03-22-at-7.10.26 PM.png',
      };

      (processFileForUpload as jest.Mock).mockResolvedValue(mockProcessedFile);
      (post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadDocument(
        mockFile,
        encounterTypeName,
        patientUuid,
      );

      expect(processFileForUpload).toHaveBeenCalledWith(mockFile);
      expect(post).toHaveBeenCalledWith(UPLOAD_DOCUMENT_URL, {
        content: mockProcessedFile.content,
        encounterTypeName,
        fileName: mockProcessedFile.fileName,
        fileType: mockProcessedFile.fileType,
        format: mockProcessedFile.format,
        patientUuid,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when file processing fails', async () => {
      const mockError = new Error('Failed to read file');
      (processFileForUpload as jest.Mock).mockRejectedValue(mockError);

      await expect(
        uploadDocument(mockFile, encounterTypeName, patientUuid),
      ).rejects.toThrow('Failed to read file');
    });

    it('should throw error when API call fails', async () => {
      const mockProcessedFile = {
        content: 'base64content',
        fileName: 'test',
        fileType: 'image',
        format: 'png',
      };

      (processFileForUpload as jest.Mock).mockResolvedValue(mockProcessedFile);
      (post as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      await expect(
        uploadDocument(mockFile, encounterTypeName, patientUuid),
      ).rejects.toThrow('Upload failed');
    });
  });
});
