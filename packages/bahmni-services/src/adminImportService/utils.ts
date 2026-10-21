import { IMPORT_ERROR_FILE_BASE_URL } from './constants';
import { ImportedItem } from './models';

export const hasDownloadableErrorFile = (item: ImportedItem): boolean =>
  item.failedRecords > 0 && !!item.errorFileName;

export const getImportErrorFileUrl = (item: ImportedItem): string | null => {
  if (!item.errorFileName) return null;
  const segments = item.errorFileName
    .split('/')
    .filter((segment) => segment !== '.' && segment !== '..')
    .map(encodeURIComponent);
  return `${IMPORT_ERROR_FILE_BASE_URL}/${segments.join('/')}`;
};
