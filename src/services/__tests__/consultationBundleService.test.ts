import { postConsultationBundle } from '../consultationBundleService';
import { post } from '../api';

jest.mock('../api');

describe('consultationBundleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('postConsultationBundle', () => {
    it('should call post with the correct URL and payload', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockBundle = { resourceType: 'ConsultationBundle' } as any;
      const mockResponse = { status: 'success' };

      (post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await postConsultationBundle(mockBundle);

      expect(post).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/ConsultationBundle`,
        mockBundle,
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
