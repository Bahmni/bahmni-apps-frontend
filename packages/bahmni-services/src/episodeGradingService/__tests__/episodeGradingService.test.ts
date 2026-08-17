import * as api from '../../api';
import { EPISODE_GRADING_STATUS_URL } from '../constants';
import { getEpisodeGradingStatus } from '../episodeGradingService';

jest.mock('../../api');

describe('episodeGradingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEpisodeGradingStatus', () => {
    it('should call the API with the episode grading-status URL', async () => {
      const episodeUuid = 'episode-uuid-123';
      const mockResponse = { alreadySubmitted: true, formUuid: 'form-uuid-1' };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getEpisodeGradingStatus(episodeUuid);

      expect(api.get).toHaveBeenCalledWith(
        EPISODE_GRADING_STATUS_URL(episodeUuid),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should propagate a response with alreadySubmitted false', async () => {
      const episodeUuid = 'episode-uuid-456';
      const mockResponse = { alreadySubmitted: false, formUuid: null };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getEpisodeGradingStatus(episodeUuid);

      expect(result).toEqual(mockResponse);
    });
  });
});

describe('EPISODE_GRADING_STATUS_URL', () => {
  it('should build the correct URL for a given episode UUID', () => {
    expect(EPISODE_GRADING_STATUS_URL('episode-uuid-123')).toBe(
      '/openmrs/ws/rest/v1/episode/episode-uuid-123/grading-status',
    );
  });
});
