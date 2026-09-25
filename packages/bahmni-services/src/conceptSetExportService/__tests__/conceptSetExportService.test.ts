import * as api from '../../api';
import { downloadBlob, exportConceptSet } from '../conceptSetExportService';
import { CONCEPT_SET_EXPORT_URL } from '../constants';

jest.mock('../../api');

describe('conceptSetExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CONCEPT_SET_EXPORT_URL', () => {
    it('encodes the concept name into the bahmnicore export endpoint', () => {
      expect(CONCEPT_SET_EXPORT_URL('Vital signs & more')).toBe(
        '/openmrs/ws/rest/v1/bahmnicore/admin/export/conceptset?conceptName=Vital%20signs%20%26%20more',
      );
    });
  });

  describe('exportConceptSet', () => {
    it('requests the export as a blob and returns it', async () => {
      const blob = new Blob(['zip-bytes'], { type: 'application/zip' });
      (api.get as jest.Mock).mockResolvedValue(blob);

      const result = await exportConceptSet('Vital signs');

      expect(api.get).toHaveBeenCalledWith(
        CONCEPT_SET_EXPORT_URL('Vital signs'),
        { responseType: 'blob' },
      );
      expect(result).toBe(blob);
    });

    it('propagates API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Server error'));

      await expect(exportConceptSet('Vital signs')).rejects.toThrow(
        'Server error',
      );
    });
  });

  describe('downloadBlob', () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;

    beforeEach(() => {
      URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      URL.revokeObjectURL = jest.fn();
    });

    afterEach(() => {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    });

    it('clicks a temporary anchor with the filename and revokes the url', () => {
      const clickSpy = jest
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(function (this: HTMLAnchorElement) {
          expect(this.download).toBe('Vital signs.zip');
          expect(this.href).toBe('blob:mock-url');
        });
      const blob = new Blob(['zip-bytes']);

      downloadBlob(blob, 'Vital signs.zip');

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(document.querySelector('a[download]')).toBeNull();
      clickSpy.mockRestore();
    });
  });
});
