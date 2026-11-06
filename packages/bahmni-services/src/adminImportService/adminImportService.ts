import { get, post } from '../api';
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
 *
 * Unlike `documentUploadService.uploadDocument` (which posts base64 JSON), this
 * posts raw `FormData` because the admin import endpoints expect a multipart
 * upload, matching the legacy AngularJS page's contract.
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
  await post(url, formData, {
    // Explicitly set multipart/form-data. The shared axios client defaults
    // `Content-Type` to `application/json`, and axios's transformRequest
    // JSON-serializes a FormData body when it sees that content type, which
    // would break the multipart upload (backend returns 500).
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) =>
      onUploadProgress?.({ loaded: event.loaded, total: event.total }),
  });
};
