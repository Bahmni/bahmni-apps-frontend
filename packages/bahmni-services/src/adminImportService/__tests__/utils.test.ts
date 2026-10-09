import { ImportedItem } from '../models';
import { getImportErrorFileUrl, hasImportError } from '../utils';

const item = (overrides: Partial<ImportedItem>): ImportedItem => ({
  id: '1',
  originalFileName: 'a.csv',
  savedFileName: null,
  errorFileName: null,
  type: null,
  status: 'COMPLETED',
  successfulRecords: 0,
  failedRecords: 0,
  stageName: null,
  uploadedBy: null,
  startTime: 0,
  endTime: null,
  stackTrace: null,
  errorMessage: null,
  ...overrides,
});

describe('adminImportService utils', () => {
  it('flags an error only when records failed', () => {
    expect(hasImportError(item({ failedRecords: 0 }))).toBe(false);
    expect(
      hasImportError(item({ failedRecords: 2, errorFileName: 'err.csv' })),
    ).toBe(true);
  });

  it('does not flag an error when records failed but no error file exists', () => {
    expect(
      hasImportError(item({ failedRecords: 2, errorFileName: null })),
    ).toBe(false);
    expect(
      hasImportError(item({ failedRecords: 2, errorFileName: 'err.csv' })),
    ).toBe(true);
  });

  it('builds the error file URL under /uploaded-files/mrs', () => {
    expect(getImportErrorFileUrl(item({ errorFileName: 'err/a.csv' }))).toBe(
      '/uploaded-files/mrs/err/a.csv',
    );
  });
});
