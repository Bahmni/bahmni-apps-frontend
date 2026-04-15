import { get } from '../../api';
import { LOCATION_BY_TAG_URL } from '../constants';
import { getLocationByTag } from '../locationService';
import {
  mockLocationResponse,
  mockEmptyLocationResponse,
} from './__mocks__/mocks';

jest.mock('../../api');

describe('locationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLocationByTag', () => {
    it.each([
      ['Login Location', mockLocationResponse, mockLocationResponse.results],
      ['Visit Location', mockEmptyLocationResponse, []],
    ])(
      'should fetch locations for tag "%s" and return results',
      async (tag, apiResponse, expected) => {
        (get as jest.Mock).mockResolvedValueOnce(apiResponse);

        const result = await getLocationByTag(tag);

        expect(get).toHaveBeenCalledWith(LOCATION_BY_TAG_URL(tag));
        expect(result).toEqual(expected);
      },
    );

    it('should return empty array when results is null', async () => {
      (get as jest.Mock).mockResolvedValueOnce({ results: null });

      const result = await getLocationByTag('Login Location');

      expect(result).toEqual([]);
    });

    it('should throw when API call fails', async () => {
      const mockError = new Error('API Error');
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(getLocationByTag('Login Location')).rejects.toThrow(
        'API Error',
      );
      expect(get).toHaveBeenCalledWith(LOCATION_BY_TAG_URL('Login Location'));
    });
  });
});
