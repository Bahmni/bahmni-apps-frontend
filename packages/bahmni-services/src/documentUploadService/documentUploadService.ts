import { post } from '../api';
import { UPLOAD_DOCUMENT_URL } from './constants';
import { DocumentUploadResponse } from './models';
import { processFileForUpload } from './utils';

export async function uploadDocument(
  file: File,
  encounterTypeName: string,
  patientUuid: string,
): Promise<DocumentUploadResponse> {
  const processedFile = await processFileForUpload(file);

  const payload = {
    content: processedFile.content,
    encounterTypeName,
    fileName: processedFile.fileName,
    fileType: processedFile.fileType,
    format: processedFile.format,
    patientUuid,
  };

  return post<DocumentUploadResponse>(UPLOAD_DOCUMENT_URL, payload);
}
