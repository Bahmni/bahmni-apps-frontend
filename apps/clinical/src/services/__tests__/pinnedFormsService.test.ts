import {
  get,
  post,
  getCurrentUser,
  USER_PINNED_PREFERENCE_URL,
  getFormattedError,
} from '@bahmni-frontend/bahmni-services';
import { loadPinnedForms, savePinnedForms } from '../pinnedFormsService';

// Mock the bahmni-services module
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  get: jest.fn(),
  post: jest.fn(),
  getCurrentUser: jest.fn(),
  USER_PINNED_PREFERENCE_URL: jest.fn(),
  getFormattedError: jest.fn(),
}));

describe('pinnedFormsService', () => {
  const mockUser = {
    uuid: 'user-uuid-123',
    username: 'testuser',
  };

  const mockUserData = {
    uuid: 'user-uuid-123',
    username: 'testuser',
    userProperties: {
      pinnedObsTemplates: 'Form A###Form B###Form C',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (USER_PINNED_PREFERENCE_URL as jest.Mock).mockReturnValue('/openmrs/ws/rest/v1/user/user-uuid-123');
  });

  describe('loadPinnedForms', () => {
    it('should load and parse pinned forms successfully', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (get as jest.Mock).mockResolvedValue(mockUserData);

      const result = await loadPinnedForms();

      expect(getCurrentUser).toHaveBeenCalled();
      expect(USER_PINNED_PREFERENCE_URL).toHaveBeenCalledWith('user-uuid-123');
      expect(get).toHaveBeenCalledWith('/openmrs/ws/rest/v1/user/user-uuid-123');
      expect(result).toEqual(['Form A', 'Form B', 'Form C']);
    });

    it('should return empty array when no user found', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      const result = await loadPinnedForms();

      expect(getCurrentUser).toHaveBeenCalled();
      expect(get).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array when userProperties is undefined', async () => {
      const userDataWithoutProperties = {
        uuid: 'user-uuid-123',
        username: 'testuser',
      };

      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (get as jest.Mock).mockResolvedValue(userDataWithoutProperties);

      const result = await loadPinnedForms();

      expect(result).toEqual([]);
    });

    it('should return empty array when pinnedObsTemplates is empty string', async () => {
      const userDataWithEmptyString = {
        ...mockUserData,
        userProperties: {
          pinnedObsTemplates: '',
        },
      };

      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (get as jest.Mock).mockResolvedValue(userDataWithEmptyString);

      const result = await loadPinnedForms();

      expect(result).toEqual([]);
    });

    it('should throw formatted error when request fails', async () => {
      const error = new Error('API request failed');
      const formattedError = { message: 'Formatted: API request failed' };

      (getCurrentUser as jest.Mock).mockRejectedValue(error);
      (getFormattedError as jest.Mock).mockReturnValue(formattedError);

      await expect(loadPinnedForms()).rejects.toBe('Formatted: API request failed');
      expect(getFormattedError).toHaveBeenCalledWith(error);
    });
  });

  describe('savePinnedForms', () => {
    it('should save pinned forms successfully', async () => {
      const formNames = ['New Form A', 'New Form B'];

      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (get as jest.Mock).mockResolvedValue(mockUserData);
      (post as jest.Mock).mockResolvedValue({});

      await savePinnedForms(formNames);

      expect(getCurrentUser).toHaveBeenCalled();
      expect(get).toHaveBeenCalledWith('/openmrs/ws/rest/v1/user/user-uuid-123');
      expect(post).toHaveBeenCalledWith('/openmrs/ws/rest/v1/user/user-uuid-123', {
        userProperties: {
          ...mockUserData.userProperties,
          pinnedObsTemplates: 'New Form A###New Form B',
        },
      });
    });

    it('should return early when no user found', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      await savePinnedForms(['Form A']);

      expect(getCurrentUser).toHaveBeenCalled();
      expect(get).not.toHaveBeenCalled();
      expect(post).not.toHaveBeenCalled();
    });

    it('should throw formatted error when request fails', async () => {
      const error = new Error('Save request failed');
      const formattedError = { message: 'Formatted: Save request failed' };

      (getCurrentUser as jest.Mock).mockRejectedValue(error);
      (getFormattedError as jest.Mock).mockReturnValue(formattedError);

      await expect(savePinnedForms(['Form A'])).rejects.toBe('Formatted: Save request failed');
      expect(getFormattedError).toHaveBeenCalledWith(error);
    });
  });
});