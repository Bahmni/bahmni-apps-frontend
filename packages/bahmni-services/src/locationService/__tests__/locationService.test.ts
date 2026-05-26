import { get } from '../../api';
import { LOCATION_BY_TAG_URL, FHIR_LOCATION_BY_TAG_URL } from '../constants';
import { getLocationByTag, getFHIRLocationsByTag } from '../locationService';
import {
  mockLocationResponse,
  mockEmptyLocationResponse,
  mockFHIRLocationBundle,
  mockEmptyFHIRLocationBundle,
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

  describe('getFHIRLocationsByTag', () => {
    it('should fetch locations from FHIR API and map to Location format', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockFHIRLocationBundle);

      const result = await getFHIRLocationsByTag('Appointment Location');

      expect(get).toHaveBeenCalledWith(
        FHIR_LOCATION_BY_TAG_URL('Appointment Location'),
      );
      expect(result).toEqual([
        {
          uuid: '7672b695-1872-40de-9ae8-a2bb38038208',
          display: 'IOM MHAC NAIROBI',
          childLocations: [],
        },
        {
          uuid: 'c8ef048d-4e31-43fa-8518-ee0d6cc32dfc',
          display: 'IOM MHAC MAKATI',
          childLocations: [],
        },
      ]);
    });

    it('should return empty array when FHIR bundle has no entries', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockEmptyFHIRLocationBundle);

      const result = await getFHIRLocationsByTag('Appointment Location');

      expect(result).toEqual([]);
    });

    it('should return empty array when FHIR bundle entry is undefined', async () => {
      (get as jest.Mock).mockResolvedValueOnce({
        resourceType: 'Bundle',
        id: 'test-bundle',
        type: 'searchset',
        total: 0,
        entry: undefined,
      });

      const result = await getFHIRLocationsByTag('Appointment Location');

      expect(result).toEqual([]);
    });

    it('should throw when FHIR API call fails', async () => {
      const mockError = new Error('FHIR API Error');
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(
        getFHIRLocationsByTag('Appointment Location'),
      ).rejects.toThrow('FHIR API Error');
      expect(get).toHaveBeenCalledWith(
        FHIR_LOCATION_BY_TAG_URL('Appointment Location'),
      );
    });
  });
});
