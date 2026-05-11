import { get, del, post } from '../../api';
import { BAHMNI_USER_COOKIE_NAME } from '../../constants/app';
import { getCookieByName, deleteCookie } from '../../utils';
import {
  USER_RESOURCE_URL,
  BAHMNI_USER_LOCATION_COOKIE,
  LOGOUT_URL,
  LOGOUT_COOKIES,
  AVAILABLE_LOCATIONS_URL,
  APP_SETTINGS_URL,
  SAVE_USER_LOCATION_URL,
  UPDATE_SESSION_LOCATION_URL,
} from '../constants';
import {
  getCurrentUser,
  getUserLoginLocation,
  logout,
  getDefaultDateFormat,
  getAvailableLocations,
  saveUserLocation,
  updateSessionLocation,
} from '../userService';

jest.mock('../../api');
jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  getCookieByName: jest.fn(),
  deleteCookie: jest.fn(),
}));

jest.mock('i18next', () => ({
  __esModule: true,
  default: {
    t: jest.fn().mockImplementation((key: string) => key),
  },
}));

describe('userService', () => {
  // Mock data
  const mockUsername = 'superman';
  const mockEncodedUsername = '%22superman%22'; // URL encoded with quotes
  const mockQuotedUsername = '"superman"';
  const mockSpecialUsername = '@super.man%20';
  const mockEncodedSpecialUsername = encodeURIComponent(mockSpecialUsername);

  const mockUserResponse = {
    results: [
      {
        uuid: 'user-uuid-123',
        username: mockUsername,
        display: 'Superman User',
        person: {
          uuid: 'person-uuid-456',
          display: 'Superman',
        },
        privileges: [],
        roles: [
          {
            uuid: 'role-uuid-789',
            display: 'Clinician',
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (get as jest.Mock).mockReset();
    (getCookieByName as jest.Mock).mockReset();
  });

  describe('getCurrentUser', () => {
    // Happy Path Tests
    it('should fetch user successfully when cookie exists', async () => {
      (getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      (get as jest.Mock).mockResolvedValue(mockUserResponse);

      const result = await getCurrentUser();

      expect(getCookieByName).toHaveBeenCalledWith(BAHMNI_USER_COOKIE_NAME);
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockUsername));
      expect(result).toEqual(mockUserResponse.results[0]);
    });

    it('should handle URL-encoded username in cookie', async () => {
      (getCookieByName as jest.Mock).mockReturnValue(mockEncodedUsername);
      (get as jest.Mock).mockResolvedValue(mockUserResponse);

      const result = await getCurrentUser();

      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockUsername));
      expect(result).toEqual(mockUserResponse.results[0]);
    });

    it('should handle quoted username in cookie', async () => {
      (getCookieByName as jest.Mock).mockReturnValue(mockQuotedUsername);
      (get as jest.Mock).mockResolvedValue(mockUserResponse);

      const result = await getCurrentUser();

      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockUsername));
      expect(result).toEqual(mockUserResponse.results[0]);
    });

    it('should handle special characters in username', async () => {
      (getCookieByName as jest.Mock).mockReturnValue(
        mockEncodedSpecialUsername,
      );
      const specialUserResponse = {
        results: [
          { ...mockUserResponse.results[0], username: mockSpecialUsername },
        ],
      };
      (get as jest.Mock).mockResolvedValue(specialUserResponse);

      const result = await getCurrentUser();

      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockSpecialUsername));
      expect(result).toEqual(specialUserResponse.results[0]);
    });

    // Sad Path Tests
    it('should return null when cookie is not found', async () => {
      (getCookieByName as jest.Mock).mockReturnValue(null);

      const result = await getCurrentUser();

      expect(result).toBeNull();
      expect(get).not.toHaveBeenCalled();
    });

    it('should return null when cookie is empty string', async () => {
      (getCookieByName as jest.Mock).mockReturnValue('');

      const result = await getCurrentUser();

      expect(result).toBeNull();
      expect(get).not.toHaveBeenCalled();
    });

    it('should return null when API returns empty results', async () => {
      (getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      (get as jest.Mock).mockResolvedValue({ results: [] });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null when API returns null results', async () => {
      (getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      (get as jest.Mock).mockResolvedValue({ results: null });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    // Error Handling Tests
    it('should throw error when API call fails', async () => {
      const mockError = new Error('API Error');
      (getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      (get as jest.Mock).mockRejectedValue(mockError);

      await expect(getCurrentUser()).rejects.toThrow(
        'ERROR_FETCHING_USER_DETAILS',
      );
      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(mockUsername));
    });

    it('should throw error when username decoding fails', async () => {
      const invalidEncoding = '%invalid';
      (getCookieByName as jest.Mock).mockReturnValue(invalidEncoding);

      await expect(getCurrentUser()).rejects.toThrow(
        'ERROR_FETCHING_USER_DETAILS',
      );
      expect(get).not.toHaveBeenCalled();
    });

    // Edge Cases
    it('should handle malformed cookie values', async () => {
      const malformedValue = '%%%invalid%%%';
      (getCookieByName as jest.Mock).mockReturnValue(malformedValue);

      await expect(getCurrentUser()).rejects.toThrow(
        'ERROR_FETCHING_USER_DETAILS',
      );
      expect(get).not.toHaveBeenCalledWith(USER_RESOURCE_URL(malformedValue));
    });

    it('should handle whitespace in username', async () => {
      const usernameWithSpace = 'super man';
      const encodedUsernameWithSpace = encodeURIComponent(usernameWithSpace);
      (getCookieByName as jest.Mock).mockReturnValue(encodedUsernameWithSpace);
      const spaceUserResponse = {
        results: [
          { ...mockUserResponse.results[0], username: usernameWithSpace },
        ],
      };
      (get as jest.Mock).mockResolvedValue(spaceUserResponse);

      const result = await getCurrentUser();

      expect(get).toHaveBeenCalledWith(USER_RESOURCE_URL(usernameWithSpace));
      expect(result).toEqual(spaceUserResponse.results[0]);
    });

    it('should return first result when API returns multiple results', async () => {
      (getCookieByName as jest.Mock).mockReturnValue(mockUsername);
      const multipleResults = {
        results: [
          mockUserResponse.results[0],
          { ...mockUserResponse.results[0], uuid: 'user-uuid-456' },
        ],
      };
      (get as jest.Mock).mockResolvedValue(multipleResults);

      const result = await getCurrentUser();

      expect(result).toEqual(multipleResults.results[0]);
    });
  });
});

const mockEncodedUserLocationCookie =
  '%7B%22name%22%3A%22Emergency%22%2C%22uuid%22%3A%22b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e%22%7D';
const mockUserLocation = {
  name: 'Emergency',
  uuid: 'b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e',
};

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

  it('should throw error when cookie does not exists', async () => {
    (getCookieByName as jest.Mock).mockReturnValue(null);
    await expect(() => getUserLoginLocation()).toThrow(
      'ERROR_FETCHING_USER_LOCATION_DETAILS',
    );
  });

  it('should throw errors when login location uuid is missing', async () => {
    const mockEncodedUserLocationCookie = '%7B%22name%22%3A%22OPD-1%22%7D';
    (getCookieByName as jest.Mock).mockReturnValue(
      mockEncodedUserLocationCookie,
    );
    await expect(() => getUserLoginLocation()).toThrow(
      'ERROR_FETCHING_USER_LOCATION_DETAILS',
    );
  });

  it('should fetch user log in location successfully when only login location name is missing', async () => {
    const userLocation = { uuid: 'b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e' };
    const mockEncodedUserLocationCookie =
      '%7B%22uuid%22%3A%22b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e%22%7D';
    (getCookieByName as jest.Mock).mockReturnValue(
      mockEncodedUserLocationCookie,
    );
    const result = await getUserLoginLocation();
    expect(getCookieByName).toHaveBeenCalledWith(BAHMNI_USER_LOCATION_COOKIE);
    expect(result).toEqual(userLocation);
  });
});

describe('logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (del as jest.Mock).mockReset();
    (deleteCookie as jest.Mock).mockReset();
  });

  it('should delete session and clear cookies on successful logout', async () => {
    (del as jest.Mock).mockResolvedValue({});

    await logout();

    expect(del).toHaveBeenCalledWith(LOGOUT_URL);
    LOGOUT_COOKIES.forEach((cookieName) => {
      expect(deleteCookie).toHaveBeenCalledWith(cookieName);
    });
  });

  it('should clear all required cookies', async () => {
    (del as jest.Mock).mockResolvedValue({});

    await logout();

    expect(deleteCookie).toHaveBeenCalledTimes(LOGOUT_COOKIES.length);
  });

  it('should throw error when API call fails', async () => {
    const mockError = new Error('Network error');
    (del as jest.Mock).mockRejectedValue(mockError);

    await expect(logout()).rejects.toThrow('USER_LOGOUT_FAILED');
  });

  it('should not clear cookies if API call fails', async () => {
    const mockError = new Error('Network error');
    (del as jest.Mock).mockRejectedValue(mockError);

    try {
      await logout();
    } catch {
      // Expected to throw
    }

    expect(deleteCookie).not.toHaveBeenCalled();
  });
});

describe('getDefaultDateFormat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (get as jest.Mock).mockReset();
  });

  it('should return the date format when setting exists', async () => {
    (get as jest.Mock).mockResolvedValue([
      { property: 'default_dateFormat', value: 'dd/MM/yyyy' },
    ]);

    const result = await getDefaultDateFormat();

    expect(get).toHaveBeenCalledWith(APP_SETTINGS_URL('commons'));
    expect(result).toBe('dd/MM/yyyy');
  });

  it('should return null when setting does not exist', async () => {
    (get as jest.Mock).mockResolvedValue([
      { property: 'other_setting', value: 'some-value' },
    ]);

    const result = await getDefaultDateFormat();

    expect(result).toBeNull();
  });

  it('should return null when settings array is empty', async () => {
    (get as jest.Mock).mockResolvedValue([]);

    const result = await getDefaultDateFormat();

    expect(result).toBeNull();
  });
});

describe('getAvailableLocations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (get as jest.Mock).mockReset();
  });

  it('should return locations on success', async () => {
    const mockLocations = [
      { name: 'Ward 1', uuid: 'uuid-1' },
      { name: 'Ward 2', uuid: 'uuid-2' },
    ];
    (get as jest.Mock).mockResolvedValue({ results: mockLocations });

    const result = await getAvailableLocations();

    expect(get).toHaveBeenCalledWith(AVAILABLE_LOCATIONS_URL);
    expect(result).toEqual(mockLocations);
  });

  it('should return empty array when results is null', async () => {
    (get as jest.Mock).mockResolvedValue({ results: null });

    const result = await getAvailableLocations();

    expect(result).toEqual([]);
  });

  it('should throw on API failure', async () => {
    (get as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(getAvailableLocations()).rejects.toThrow('Network error');
  });
});

describe('saveUserLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (post as jest.Mock).mockReset();
  });

  it('should post location to the correct URL', async () => {
    (post as jest.Mock).mockResolvedValue({});

    await saveUserLocation('user-uuid-123', {
      name: 'ICU',
      uuid: 'loc-uuid-456',
    });

    expect(post).toHaveBeenCalledWith(SAVE_USER_LOCATION_URL('user-uuid-123'), {
      userProperties: { loginLocation: 'loc-uuid-456' },
    });
  });
});

describe('updateSessionLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (post as jest.Mock).mockReset();
  });

  it('should post sessionLocation to the session URL', async () => {
    (post as jest.Mock).mockResolvedValue({});

    await updateSessionLocation('loc-uuid-456');

    expect(post).toHaveBeenCalledWith(UPDATE_SESSION_LOCATION_URL, {
      sessionLocation: 'loc-uuid-456',
    });
  });

  it('should throw when the API call fails', async () => {
    (post as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(updateSessionLocation('loc-uuid-456')).rejects.toThrow(
      'Network error',
    );
  });
});
