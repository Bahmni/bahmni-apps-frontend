import { IMPORT_ERROR_FILE_BASE_URL } from './constants';
import { ImportedItem } from './models';

export const hasImportError = (item: ImportedItem): boolean =>
  item.failedRecords > 0 && !!item.errorFileName;

export const getImportErrorFileUrl = (item: ImportedItem): string =>
  `${IMPORT_ERROR_FILE_BASE_URL}/${item.errorFileName}`;
