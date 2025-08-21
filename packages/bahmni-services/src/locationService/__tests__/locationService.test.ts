import { getCookieByName } from '../../utils';
import { BAHMNI_USER_LOCATION_COOKIE } from '../constants';
import { getUserLoginLocation } from '../index';

const mockEncodedUserLocationCookie =
  '%7B%22name%22%3A%22Emergency%22%2C%22uuid%22%3A%22b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e%22%7D';
const mockUserLocation = {
  name: 'Emergency',
  uuid: 'b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e',
};

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  getCookieByName: jest.fn(),
}));

describe('getUserLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCookieByName as jest.Mock).mockReset();
  });
  it('should fetch user log in location successfully when cookie exists', async () => {
    (getCookieByName as jest.Mock).mockReturnValue(
      mockEncodedUserLocationCookie,
    );
    const result = await getUserLoginLocation();
    expect(getCookieByName).toHaveBeenCalledWith(BAHMNI_USER_LOCATION_COOKIE);
    expect(result).toEqual(mockUserLocation);
  });

  it('should return null for user log in location when cookie does not exists', async () => {
    (getCookieByName as jest.Mock).mockReturnValue(null);
    const result = await getUserLoginLocation();
    expect(getCookieByName).toHaveBeenCalledWith(BAHMNI_USER_LOCATION_COOKIE);
    expect(result).toBeNull();
  });
});
