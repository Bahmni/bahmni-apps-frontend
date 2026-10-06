import { get } from '../../api';
import client from '../../api/client';
import { getImportedItems, uploadImportFile } from '../adminImportService';
import { ADMIN_IMPORT_STATUS_URL, IMPORT_TYPES } from '../constants';

jest.mock('../../api');
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const mockGet = get as jest.MockedFunction<typeof get>;
const mockPost = client.post as jest.Mock;

describe('adminImportService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getImportedItems', () => {
    it('fetches the status URL with no query params', async () => {
      mockGet.mockResolvedValue([{ id: '1' }]);

      const result = await getImportedItems();

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(ADMIN_IMPORT_STATUS_URL);
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  describe('uploadImportFile', () => {
    it('posts multipart data with patientMatchingAlgorithm before file', async () => {
      mockPost.mockResolvedValue({});
      const file = new File(['a,b'], 'sample.csv', { type: 'text/csv' });

      await uploadImportFile('/upload/concept', file, 'algo');

      const [url, body, config] = mockPost.mock.calls[0];
      expect(url).toBe('/upload/concept');
      expect(config.headers).toEqual({ 'Content-Type': 'multipart/form-data' });
      const keys: string[] = [];
      (body as FormData).forEach((_value, key) => keys.push(key));
      expect(keys).toEqual(['patientMatchingAlgorithm', 'file']);
      expect((body as FormData).get('patientMatchingAlgorithm')).toBe('algo');
      expect((body as FormData).get('file')).toBe(file);
    });

    it('defaults patientMatchingAlgorithm to an empty string', async () => {
      mockPost.mockResolvedValue({});

      await uploadImportFile('/u', new File(['x'], 'a.csv'));

      const body = mockPost.mock.calls[0][1] as FormData;
      expect(body.get('patientMatchingAlgorithm')).toBe('');
    });

    it('reports upload progress', async () => {
      const onProgress = jest.fn();
      mockPost.mockImplementation(async (_u, _b, config) => {
        config.onUploadProgress({ loaded: 5, total: 10 });
      });

      await uploadImportFile('/u', new File(['x'], 'a.csv'), '', onProgress);

      expect(onProgress).toHaveBeenCalledWith({ loaded: 5, total: 10 });
    });

    it('propagates upload failures', async () => {
      mockPost.mockRejectedValue(new Error('boom'));

      await expect(
        uploadImportFile('/u', new File(['x'], 'a.csv')),
      ).rejects.toThrow('boom');
    });
  });

  it('lists the 11 legacy import types in legacy order', () => {
    expect(IMPORT_TYPES.map((type) => type.key)).toEqual([
      'concept',
      'conceptset',
      'program',
      'patient',
      'encounter',
      'form2encounter',
      'drug',
      'labResults',
      'referenceterms',
      'updateReferenceTerms',
      'relationship',
    ]);
    expect(
      IMPORT_TYPES.find((type) => type.key === 'updateReferenceTerms')?.url,
    ).toBe('/openmrs/ws/rest/v1/bahmnicore/admin/upload/referenceterms/new');
  });
});
