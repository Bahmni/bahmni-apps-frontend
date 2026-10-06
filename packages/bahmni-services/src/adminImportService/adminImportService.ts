import { get } from '../api';
import client from '../api/client';
import { ADMIN_IMPORT_STATUS_URL } from './constants';
import { ImportedItem, UploadProgress } from './models';

/**
 * Fetches the upload history. Sends no numberOfDays, so the backend default applies.
 */
export const getImportedItems = async (): Promise<ImportedItem[]> => {
  return get<ImportedItem[]>(ADMIN_IMPORT_STATUS_URL);
};

/**
 * Uploads one CSV file as multipart form data.
 * Field order matches the legacy page: patientMatchingAlgorithm, then file.
 */
export const uploadImportFile = async (
  url: string,
  file: File,
  patientMatchingAlgorithm: string = '',
  onUploadProgress?: (progress: UploadProgress) => void,
): Promise<void> => {
  const formData = new FormData();
  formData.append('patientMatchingAlgorithm', patientMatchingAlgorithm);
  formData.append('file', file);
  await client.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) =>
      onUploadProgress?.({ loaded: event.loaded, total: event.total }),
  });
};
