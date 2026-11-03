import { ImportedItem } from '../models';
import { getImportErrorFileUrl, hasDownloadableErrorFile } from '../utils';

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
  it('flags a downloadable error file only when records failed and a file exists', () => {
    expect(hasDownloadableErrorFile(item({ failedRecords: 0 }))).toBe(false);
    expect(
      hasDownloadableErrorFile(
        item({ failedRecords: 2, errorFileName: 'err.csv' }),
      ),
    ).toBe(true);
  });

  it('does not flag a downloadable error file when records failed but no error file exists', () => {
    expect(
      hasDownloadableErrorFile(item({ failedRecords: 2, errorFileName: null })),
    ).toBe(false);
    expect(
      hasDownloadableErrorFile(
        item({ failedRecords: 2, errorFileName: 'err.csv' }),
      ),
    ).toBe(true);
  });

  it('builds the error file URL under /uploaded-files/mrs', () => {
    expect(getImportErrorFileUrl(item({ errorFileName: 'err/a.csv' }))).toBe(
      '/uploaded-files/mrs/err/a.csv',
    );
  });

  it('encodes special characters per path segment in the error file URL', () => {
    expect(getImportErrorFileUrl(item({ errorFileName: 'err/a#b.csv' }))).toBe(
      '/uploaded-files/mrs/err/a%23b.csv',
    );
  });

  it('returns null for a null errorFileName', () => {
    expect(getImportErrorFileUrl(item({ errorFileName: null }))).toBeNull();
  });

  it('strips dot and dot-dot path segments to prevent traversal', () => {
    expect(
      getImportErrorFileUrl(item({ errorFileName: '../../../etc/passwd' })),
    ).toBe('/uploaded-files/mrs/etc/passwd');
  });
});
